/**
 * Branch Geometry Builder
 *
 * Generates 3D mesh geometry for tree branches from skeleton data.
 * Creates cylindrical geometry by generating rings of vertices at each node
 * and connecting them with triangles.
 *
 * The geometry is suitable for use with Three.js BufferGeometry and can be
 * textured with bark textures using the generated UV coordinates.
 */

import { vec3, addVec3, normalizeVec3 } from '../utils/math'
import type { Vec3 } from '../utils/math'
import { rotateVec3ByQuat } from '../utils/quaternion'
import type { Quat } from '../utils/quaternion'
import { calculateBranchUV, calculateVOffset } from './uvMapping'
import type {
  Skeleton,
  SkeletonNode,
  GeometryData,
  BranchGeometryConfig,
} from './skeleton'

/**
 * Data structure for a ring of vertices around a branch center.
 * Contains flat arrays for efficient GPU upload.
 */
export interface RingData {
  /** Flat array of vertex positions: x,y,z,x,y,z,... */
  positions: number[]
  /** Flat array of vertex normals: x,y,z,x,y,z,... */
  normals: number[]
}

/**
 * Parameters for generating a ring of vertices.
 */
interface GenerateRingParams {
  /** Center point of the ring in world space */
  center: Vec3
  /** Orientation quaternion defining the ring's plane */
  orientation: Quat
  /** Radius of the ring (distance from center to vertices) */
  radius: number
  /** Number of vertices in the ring */
  segments: number
}

/**
 * Parameters for connecting two rings with triangles.
 */
interface ConnectRingsParams {
  /** Starting vertex index of the first ring */
  ring1Offset: number
  /** Starting vertex index of the second ring */
  ring2Offset: number
  /** Number of vertices per ring */
  segments: number
}

/**
 * Parameters for building complete branch geometry.
 */
interface BuildBranchGeometryParams {
  /** The tree skeleton to generate geometry from */
  skeleton: Skeleton
  /** Configuration for geometry generation */
  config: BranchGeometryConfig
}

/**
 * Generate a ring of vertices around a center point.
 *
 * The ring lies in a plane perpendicular to the branch direction.
 * With identity orientation, the default branch direction is (0,1,0) (up),
 * so the ring lies in the XZ plane.
 *
 * Each vertex is placed at angle (i * 2PI / segments) around the ring.
 * Position formula: center + rotate(radius * (cos(angle), 0, sin(angle)), orientation)
 * Normal: normalized vector pointing outward from center to vertex.
 *
 * @param params - Object containing center, orientation, radius, and segments
 * @returns RingData with flat position and normal arrays
 */
export function generateRing(params: GenerateRingParams): RingData {
  const { center, orientation, radius, segments } = params

  const positions: number[] = []
  const normals: number[] = []

  // Generate each vertex around the ring
  for (let i = 0; i < segments; i++) {
    // Calculate angle for this vertex (evenly spaced around circle)
    const angle = (i * 2 * Math.PI) / segments

    // Create local position on the XZ plane (before rotation)
    // The ring is centered at origin, lying flat in XZ plane
    const localPos = vec3({
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
    })

    // Rotate the local position by the orientation quaternion
    // This transforms the ring to align with the branch direction
    const rotatedPos = rotateVec3ByQuat({ v: localPos, q: orientation })

    // Translate to world position by adding center
    const worldPos = addVec3({ a: center, b: rotatedPos })

    // Store position (x, y, z)
    positions.push(worldPos.x, worldPos.y, worldPos.z)

    // Calculate normal: points outward from center
    // Normal is the same as rotatedPos direction (since center is at origin in local space)
    const normal = normalizeVec3({ v: rotatedPos })

    // Store normal (x, y, z)
    normals.push(normal.x, normal.y, normal.z)
  }

  return { positions, normals }
}

/**
 * Generate triangle indices connecting two rings.
 *
 * Creates a cylinder segment by generating two triangles for each quad
 * between adjacent vertices on both rings. The indices wrap around
 * to connect the last vertices back to the first.
 *
 * For each quad (vertices i and i+1 on both rings):
 * - Triangle 1: ring1[i], ring2[i], ring1[i+1]
 * - Triangle 2: ring1[i+1], ring2[i], ring2[i+1]
 *
 * This winding order ensures consistent face orientation for backface culling.
 *
 * @param params - Object containing ring offsets and segment count
 * @returns Array of triangle indices
 */
export function connectRings(params: ConnectRingsParams): number[] {
  const { ring1Offset, ring2Offset, segments } = params

  const indices: number[] = []

  // Connect each pair of adjacent vertices between rings
  for (let i = 0; i < segments; i++) {
    // Calculate vertex indices for this quad
    // Current vertices on each ring
    const r1Current = ring1Offset + i
    const r2Current = ring2Offset + i

    // Next vertices (wrapping around to start)
    const r1Next = ring1Offset + ((i + 1) % segments)
    const r2Next = ring2Offset + ((i + 1) % segments)

    // Triangle 1: ring1[i], ring2[i], ring1[i+1]
    indices.push(r1Current, r2Current, r1Next)

    // Triangle 2: ring1[i+1], ring2[i], ring2[i+1]
    indices.push(r1Next, r2Current, r2Next)
  }

  return indices
}

/**
 * Build complete branch geometry from a skeleton.
 *
 * Iterates through each segment in the skeleton, generating:
 * - A ring at the start node
 * - A ring at the end node
 * - Triangles connecting the two rings
 * - UV coordinates for texture mapping
 *
 * The resulting geometry is ready for use with Three.js BufferGeometry.
 *
 * @param params - Object containing skeleton and configuration
 * @returns GeometryData with Float32Arrays for GPU upload
 */
export function buildBranchGeometry(
  params: BuildBranchGeometryParams
): GeometryData {
  const { skeleton, config } = params
  const { radialSegments, textureRepeatY } = config

  // Accumulators for all geometry data
  const allPositions: number[] = []
  const allNormals: number[] = []
  const allUvs: number[] = []
  const allIndices: number[] = []

  // Track current vertex offset for index generation
  let vertexOffset = 0

  // Create segment info array for UV offset calculations
  const segmentInfos = skeleton.segments.map((seg) => ({ length: seg.length }))

  // Process each segment in the skeleton
  skeleton.segments.forEach((segment, segmentIndex) => {
    // Find the start and end nodes for this segment
    const startNode = skeleton.nodes.find(
      (n) => n.id === segment.startNodeId
    ) as SkeletonNode
    const endNode = skeleton.nodes.find(
      (n) => n.id === segment.endNodeId
    ) as SkeletonNode

    // Calculate V offset for UV continuity along the branch
    const vOffset = calculateVOffset({
      segmentIndex,
      segments: segmentInfos,
      textureScale: textureRepeatY,
    })

    // Generate ring at start of segment
    const startRing = generateRing({
      center: startNode.position,
      orientation: startNode.orientation,
      radius: segment.startRadius,
      segments: radialSegments,
    })

    // Generate ring at end of segment
    const endRing = generateRing({
      center: endNode.position,
      orientation: endNode.orientation,
      radius: segment.endRadius,
      segments: radialSegments,
    })

    // Store vertex positions and normals for both rings
    const ring1Offset = vertexOffset
    const ring2Offset = vertexOffset + radialSegments

    // Add start ring positions and normals
    allPositions.push(...startRing.positions)
    allNormals.push(...startRing.normals)

    // Add end ring positions and normals
    allPositions.push(...endRing.positions)
    allNormals.push(...endRing.normals)

    // Generate UVs for both rings
    // We have 2 rings total in this segment (start and end)
    const totalRings = 2

    // Start ring UVs (ring index 0)
    for (let i = 0; i < radialSegments; i++) {
      const uv = calculateBranchUV({
        ringIndex: 0,
        vertexIndex: i,
        totalRings,
        radialSegments,
        segmentLength: segment.length,
        textureScale: textureRepeatY,
        vOffset,
      })
      allUvs.push(uv.u, uv.v)
    }

    // End ring UVs (ring index 1)
    for (let i = 0; i < radialSegments; i++) {
      const uv = calculateBranchUV({
        ringIndex: 1,
        vertexIndex: i,
        totalRings,
        radialSegments,
        segmentLength: segment.length,
        textureScale: textureRepeatY,
        vOffset,
      })
      allUvs.push(uv.u, uv.v)
    }

    // Generate triangle indices connecting the two rings
    const segmentIndices = connectRings({
      ring1Offset,
      ring2Offset,
      segments: radialSegments,
    })
    allIndices.push(...segmentIndices)

    // Update vertex offset for next segment
    // Each segment adds 2 rings worth of vertices
    vertexOffset += radialSegments * 2
  })

  // Convert to typed arrays for GPU upload
  return {
    positions: new Float32Array(allPositions),
    normals: new Float32Array(allNormals),
    uvs: new Float32Array(allUvs),
    indices: new Uint32Array(allIndices),
  }
}
