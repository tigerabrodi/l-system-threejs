/**
 * Leaf Geometry Builder
 *
 * Creates leaf mesh geometry and per-instance data for instanced rendering.
 * The base leaf shape is reused for all leaf instances, while each instance
 * has its own transformation matrix and color variation.
 */

import { vec3, normalizeVec3, crossVec3 } from '../utils/math'
import type { Vec3 } from '../utils/math'
import { multiplyQuat, quatFromAxisAngle } from '../utils/quaternion'
import { createRandom } from '../lsystem/random'
import type {
  LeafPoint,
  LeafShapeConfig,
  LeafInstanceConfig,
  LeafInstanceData,
  GeometryData,
} from './skeleton'

/**
 * Parameters for creating the base leaf shape geometry.
 */
export interface CreateLeafShapeParams {
  /** Configuration for the leaf shape dimensions and curvature */
  config: LeafShapeConfig
}

/**
 * Parameters for building leaf instance data.
 */
export interface BuildLeafInstancesParams {
  /** Array of leaf placement points from the skeleton */
  leaves: LeafPoint[]
  /** Configuration for instancing (colors, variation, etc.) */
  config: LeafInstanceConfig
}

/**
 * Create the base leaf mesh geometry (a simple quad or slightly curved shape).
 * This geometry is reused for all leaf instances.
 *
 * The leaf is oriented along the Y axis (from 0 to length) with width
 * spreading in the X direction. Curvature bends the leaf backward in Z.
 *
 * @param params - Object containing the leaf shape configuration
 * @returns GeometryData ready for Three.js BufferGeometry
 */
export function createLeafShape(params: CreateLeafShapeParams): GeometryData {
  const { config } = params
  const { width, length, curvature, segments } = config

  // Number of rows = segments + 1 (one row per subdivision boundary)
  // Each row has 2 vertices (left and right edges)
  const rowCount = segments + 1
  const vertexCount = rowCount * 2

  // Allocate arrays for geometry data
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)

  // Each segment has 2 triangles (forming a quad)
  // Total triangles = segments * 2, each triangle has 3 indices
  const triangleCount = segments * 2
  const indices = new Uint32Array(triangleCount * 3)

  // Half width for left/right edge calculation
  const halfWidth = width / 2

  // Generate vertices row by row from bottom to top
  for (let row = 0; row < rowCount; row++) {
    // Normalized position along the leaf (0 at base, 1 at tip)
    const t = row / segments
    const y = t * length

    // Curvature: z = curvature * (y / length)^2 * length
    // Simplifies to: z = curvature * t^2 * length
    const z = curvature * t * t * length

    // Left vertex (negative X)
    const leftIndex = row * 2
    positions[leftIndex * 3 + 0] = -halfWidth // x
    positions[leftIndex * 3 + 1] = y // y
    positions[leftIndex * 3 + 2] = z // z

    // Right vertex (positive X)
    const rightIndex = row * 2 + 1
    positions[rightIndex * 3 + 0] = halfWidth // x
    positions[rightIndex * 3 + 1] = y // y
    positions[rightIndex * 3 + 2] = z // z

    // UV coordinates: u = (x + width/2) / width, v = y / length
    uvs[leftIndex * 2 + 0] = 0 // Left edge: u = 0
    uvs[leftIndex * 2 + 1] = t // v = t = y/length

    uvs[rightIndex * 2 + 0] = 1 // Right edge: u = 1
    uvs[rightIndex * 2 + 1] = t // v = t = y/length
  }

  // Calculate normals - approximate face normals adjusted for curvature
  // The normal tilts backward as curvature increases
  for (let row = 0; row < rowCount; row++) {
    // Calculate tangent along the leaf surface (Y direction with Z curve)
    const t = row / segments

    // Derivative of z = curvature * t^2 * length with respect to y
    // dz/dy = dz/dt * dt/dy = 2 * curvature * t * length * (1/length)
    //       = 2 * curvature * t
    const dzdy = 2 * curvature * t

    // Tangent along Y axis (pointing up and back due to curvature)
    const tangentY: Vec3 = normalizeVec3({
      v: vec3({ x: 0, y: 1, z: dzdy }),
    })

    // Tangent along X axis (always horizontal)
    const tangentX: Vec3 = vec3({ x: 1, y: 0, z: 0 })

    // Normal = cross(tangentX, tangentY) to get outward-facing normal
    const normal = normalizeVec3({
      v: crossVec3({ a: tangentX, b: tangentY }),
    })

    // Apply same normal to both vertices in this row
    const leftIndex = row * 2
    const rightIndex = row * 2 + 1

    normals[leftIndex * 3 + 0] = normal.x
    normals[leftIndex * 3 + 1] = normal.y
    normals[leftIndex * 3 + 2] = normal.z

    normals[rightIndex * 3 + 0] = normal.x
    normals[rightIndex * 3 + 1] = normal.y
    normals[rightIndex * 3 + 2] = normal.z
  }

  // Generate triangle indices (two triangles per segment)
  let indexOffset = 0
  for (let seg = 0; seg < segments; seg++) {
    // Vertices for this quad segment
    const bottomLeft = seg * 2
    const bottomRight = seg * 2 + 1
    const topLeft = (seg + 1) * 2
    const topRight = (seg + 1) * 2 + 1

    // First triangle: bottom-left, top-left, top-right
    indices[indexOffset++] = bottomLeft
    indices[indexOffset++] = topLeft
    indices[indexOffset++] = topRight

    // Second triangle: bottom-left, top-right, bottom-right
    indices[indexOffset++] = bottomLeft
    indices[indexOffset++] = topRight
    indices[indexOffset++] = bottomRight
  }

  return {
    positions,
    normals,
    uvs,
    indices,
  }
}

/**
 * Build per-instance data for instanced leaf rendering.
 * Creates transformation matrices and color variations for each leaf.
 *
 * @param params - Object containing leaf points and instance configuration
 * @returns LeafInstanceData with packed matrices and colors
 */
export function buildLeafInstances(
  params: BuildLeafInstancesParams
): LeafInstanceData {
  const { leaves, config } = params
  const { baseColor, colorVariation, sizeVariation, rotationScatter, seed } =
    config

  const count = leaves.length

  // Early return for empty input
  if (count === 0) {
    return {
      matrices: new Float32Array(0),
      colors: new Float32Array(0),
      count: 0,
    }
  }

  // Allocate arrays for instance data
  // 16 floats per 4x4 matrix, 3 floats per RGB color
  const matrices = new Float32Array(count * 16)
  const colors = new Float32Array(count * 3)

  // Create seeded RNG for deterministic variation
  const rng = createRandom({ seed })

  // Process each leaf
  for (let i = 0; i < count; i++) {
    const leaf = leaves[i]

    // Generate random variations
    const sizeMult = 1 + (rng.random() * 2 - 1) * sizeVariation
    const scatterX = (rng.random() * 2 - 1) * rotationScatter
    const scatterY = (rng.random() * 2 - 1) * rotationScatter
    const scatterZ = (rng.random() * 2 - 1) * rotationScatter

    // Color variation (random offset for each channel)
    const rVar = (rng.random() * 2 - 1) * colorVariation
    const gVar = (rng.random() * 2 - 1) * colorVariation
    const bVar = (rng.random() * 2 - 1) * colorVariation

    // Clamp colors to [0, 1]
    colors[i * 3 + 0] = Math.max(0, Math.min(1, baseColor.r + rVar))
    colors[i * 3 + 1] = Math.max(0, Math.min(1, baseColor.g + gVar))
    colors[i * 3 + 2] = Math.max(0, Math.min(1, baseColor.b + bVar))

    // Build rotation with scatter applied
    // Start with the leaf's base orientation
    let orientation = leaf.orientation

    // Apply scatter rotations (small random rotations around each axis)
    if (rotationScatter > 0) {
      const scatterQuatX = quatFromAxisAngle({
        axis: vec3({ x: 1, y: 0, z: 0 }),
        angle: scatterX,
      })
      const scatterQuatY = quatFromAxisAngle({
        axis: vec3({ x: 0, y: 1, z: 0 }),
        angle: scatterY,
      })
      const scatterQuatZ = quatFromAxisAngle({
        axis: vec3({ x: 0, y: 0, z: 1 }),
        angle: scatterZ,
      })

      // Combine scatter rotations with base orientation
      orientation = multiplyQuat({
        a: orientation,
        b: multiplyQuat({
          a: scatterQuatX,
          b: multiplyQuat({ a: scatterQuatY, b: scatterQuatZ }),
        }),
      })
    }

    // Calculate final scale (base size * variation)
    const scale = leaf.size * sizeMult

    // Build 4x4 transformation matrix (column-major for WebGL)
    // Matrix = Translation * Rotation * Scale
    // We compute the rotation matrix from the quaternion and combine with scale

    // Extract rotation matrix from quaternion
    const q = orientation
    const xx = q.x * q.x
    const yy = q.y * q.y
    const zz = q.z * q.z
    const xy = q.x * q.y
    const xz = q.x * q.z
    const yz = q.y * q.z
    const wx = q.w * q.x
    const wy = q.w * q.y
    const wz = q.w * q.z

    // Rotation matrix elements (combined with scale)
    const r00 = (1 - 2 * (yy + zz)) * scale
    const r01 = 2 * (xy - wz) * scale
    const r02 = 2 * (xz + wy) * scale

    const r10 = 2 * (xy + wz) * scale
    const r11 = (1 - 2 * (xx + zz)) * scale
    const r12 = 2 * (yz - wx) * scale

    const r20 = 2 * (xz - wy) * scale
    const r21 = 2 * (yz + wx) * scale
    const r22 = (1 - 2 * (xx + yy)) * scale

    // Pack into column-major 4x4 matrix
    // Column 0 (indices 0-3)
    matrices[i * 16 + 0] = r00
    matrices[i * 16 + 1] = r10
    matrices[i * 16 + 2] = r20
    matrices[i * 16 + 3] = 0

    // Column 1 (indices 4-7)
    matrices[i * 16 + 4] = r01
    matrices[i * 16 + 5] = r11
    matrices[i * 16 + 6] = r21
    matrices[i * 16 + 7] = 0

    // Column 2 (indices 8-11)
    matrices[i * 16 + 8] = r02
    matrices[i * 16 + 9] = r12
    matrices[i * 16 + 10] = r22
    matrices[i * 16 + 11] = 0

    // Column 3 - translation (indices 12-15)
    matrices[i * 16 + 12] = leaf.position.x
    matrices[i * 16 + 13] = leaf.position.y
    matrices[i * 16 + 14] = leaf.position.z
    matrices[i * 16 + 15] = 1
  }

  return {
    matrices,
    colors,
    count,
  }
}
