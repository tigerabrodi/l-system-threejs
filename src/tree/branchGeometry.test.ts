import { describe, it, expect } from 'bun:test'
import {
  generateRing,
  connectRings,
  buildBranchGeometry,
} from './branchGeometry'
import { identityQuat, quatFromAxisAngle } from '../utils/quaternion'
import { vec3, lengthVec3, subVec3 } from '../utils/math'
import type { Skeleton, SkeletonNode, SkeletonSegment } from './skeleton'

describe('generateRing', () => {
  /**
   * Test that generateRing creates the correct number of vertices.
   * Each segment value creates one vertex, so segments=8 means 8 vertices.
   */
  it('generates correct number of vertices', () => {
    const result = generateRing({
      center: vec3({ x: 0, y: 0, z: 0 }),
      orientation: identityQuat(),
      radius: 1.0,
      segments: 8,
    })

    // positions array has 3 floats per vertex (x, y, z)
    // 8 segments = 8 vertices = 24 position values
    expect(result.positions.length).toBe(24)

    // normals array should match positions array length
    expect(result.normals.length).toBe(24)
  })

  /**
   * Test that all vertices lie on a circle of the correct radius.
   * Distance from center to each vertex should equal the specified radius.
   */
  it('vertices lie on circle of correct radius', () => {
    const center = vec3({ x: 0, y: 5, z: 0 })
    const radius = 2.5
    const segments = 6

    const result = generateRing({
      center,
      orientation: identityQuat(),
      radius,
      segments,
    })

    // Check each vertex is at the correct distance from center
    for (let i = 0; i < segments; i++) {
      const vx = result.positions[i * 3]
      const vy = result.positions[i * 3 + 1]
      const vz = result.positions[i * 3 + 2]

      const vertex = vec3({ x: vx, y: vy, z: vz })
      const diff = subVec3({ a: vertex, b: center })
      const distance = lengthVec3({ v: diff })

      // Distance should be equal to radius (within floating point tolerance)
      expect(distance).toBeCloseTo(radius, 5)
    }
  })

  /**
   * Test that normals point outward from the center.
   * Each normal should be a unit vector pointing from center toward the vertex.
   */
  it('normals point outward', () => {
    const center = vec3({ x: 0, y: 0, z: 0 })
    const radius = 1.0
    const segments = 8

    const result = generateRing({
      center,
      orientation: identityQuat(),
      radius,
      segments,
    })

    for (let i = 0; i < segments; i++) {
      // Get position and normal
      const px = result.positions[i * 3]
      const py = result.positions[i * 3 + 1]
      const pz = result.positions[i * 3 + 2]

      const nx = result.normals[i * 3]
      const ny = result.normals[i * 3 + 1]
      const nz = result.normals[i * 3 + 2]

      // The normal should point in the same direction as (position - center)
      // For center at origin, normal should point in same direction as position
      const position = vec3({ x: px, y: py, z: pz })
      const normal = vec3({ x: nx, y: ny, z: nz })

      // Check normal is normalized (unit length)
      const normalLength = lengthVec3({ v: normal })
      expect(normalLength).toBeCloseTo(1.0, 5)

      // Calculate expected normal direction (position - center, normalized)
      const toVertex = subVec3({ a: position, b: center })
      const expectedDir =
        lengthVec3({ v: toVertex }) > 0
          ? {
              x: toVertex.x / lengthVec3({ v: toVertex }),
              y: toVertex.y / lengthVec3({ v: toVertex }),
              z: toVertex.z / lengthVec3({ v: toVertex }),
            }
          : normal

      // Normal should match expected direction
      expect(nx).toBeCloseTo(expectedDir.x, 5)
      expect(ny).toBeCloseTo(expectedDir.y, 5)
      expect(nz).toBeCloseTo(expectedDir.z, 5)
    }
  })

  /**
   * Test that orientation quaternion correctly rotates the ring.
   * With identity quaternion, ring lies in XZ plane (Y is up).
   * With 90 degree rotation around X axis, the ring should be tilted
   * so that Z becomes Y and Y becomes -Z.
   */
  it('orientation rotates the ring correctly', () => {
    const center = vec3({ x: 0, y: 0, z: 0 })
    const radius = 1.0
    const segments = 4

    // Rotate 90 degrees around X axis
    // This transforms: Y -> Z, Z -> -Y
    // So the XZ plane (with Y=0) becomes the XY plane (with Z=0)
    const rotation = quatFromAxisAngle({
      axis: vec3({ x: 1, y: 0, z: 0 }),
      angle: Math.PI / 2,
    })

    const result = generateRing({
      center,
      orientation: rotation,
      radius,
      segments,
    })

    // After rotating 90 degrees around X axis:
    // Original XZ plane ring now lies in XY plane
    // All Y coordinates should be non-zero (except possibly at origin)
    // All original Z values are now in -Y
    // Since we started with Y=0, the rotated positions should have Z near 0
    // Actually: (x, 0, z) rotated 90 deg around X -> (x, -z, 0)
    for (let i = 0; i < segments; i++) {
      const z = result.positions[i * 3 + 2]
      expect(Math.abs(z)).toBeLessThan(0.001)
    }
  })
})

describe('connectRings', () => {
  /**
   * Test that connectRings generates the correct number of triangles.
   * For n segments, there are n quads between rings, each quad = 2 triangles.
   * Total indices = n * 2 * 3 = n * 6
   */
  it('generates correct number of triangles', () => {
    const segments = 8

    const indices = connectRings({
      ring1Offset: 0,
      ring2Offset: 8,
      segments,
    })

    // 8 quads * 2 triangles/quad * 3 indices/triangle = 48 indices
    expect(indices.length).toBe(48)
  })

  /**
   * Test that all indices reference valid vertex positions.
   * With ring1Offset=0 and ring2Offset=8, valid indices are 0-7 and 8-15.
   */
  it('indices reference valid vertex range', () => {
    const segments = 6
    const ring1Offset = 10
    const ring2Offset = 16

    const indices = connectRings({
      ring1Offset,
      ring2Offset,
      segments,
    })

    const minValid = ring1Offset
    const maxValid = ring2Offset + segments - 1

    // All indices should be within valid range
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(minValid)
      expect(idx).toBeLessThanOrEqual(maxValid)
    }
  })

  /**
   * Test that indices correctly connect the two rings.
   * Each quad should use vertices from both ring1 and ring2.
   */
  it('connects vertices from both rings', () => {
    const segments = 4
    const ring1Offset = 0
    const ring2Offset = 4

    const indices = connectRings({
      ring1Offset,
      ring2Offset,
      segments,
    })

    // Check that we have triangles referencing both rings
    let hasRing1 = false
    let hasRing2 = false

    for (const idx of indices) {
      if (idx >= ring1Offset && idx < ring1Offset + segments) {
        hasRing1 = true
      }
      if (idx >= ring2Offset && idx < ring2Offset + segments) {
        hasRing2 = true
      }
    }

    expect(hasRing1).toBe(true)
    expect(hasRing2).toBe(true)
  })
})

describe('buildBranchGeometry', () => {
  /**
   * Helper function to create a simple test skeleton with one segment.
   */
  function createSimpleSkeleton(): Skeleton {
    const node1: SkeletonNode = {
      id: 0,
      position: vec3({ x: 0, y: 0, z: 0 }),
      orientation: identityQuat(),
      radius: 1.0,
      parentId: null,
      depth: 0,
      isTerminal: false,
      isBranchPoint: false,
    }

    const node2: SkeletonNode = {
      id: 1,
      position: vec3({ x: 0, y: 2, z: 0 }),
      orientation: identityQuat(),
      radius: 0.8,
      parentId: 0,
      depth: 0,
      isTerminal: true,
      isBranchPoint: false,
    }

    const segment: SkeletonSegment = {
      startNodeId: 0,
      endNodeId: 1,
      startRadius: 1.0,
      endRadius: 0.8,
      length: 2.0,
    }

    return {
      nodes: [node1, node2],
      segments: [segment],
      leaves: [],
    }
  }

  /**
   * Helper function to create a skeleton with multiple segments.
   */
  function createMultiSegmentSkeleton(): Skeleton {
    const node1: SkeletonNode = {
      id: 0,
      position: vec3({ x: 0, y: 0, z: 0 }),
      orientation: identityQuat(),
      radius: 1.0,
      parentId: null,
      depth: 0,
      isTerminal: false,
      isBranchPoint: false,
    }

    const node2: SkeletonNode = {
      id: 1,
      position: vec3({ x: 0, y: 2, z: 0 }),
      orientation: identityQuat(),
      radius: 0.8,
      parentId: 0,
      depth: 0,
      isTerminal: false,
      isBranchPoint: false,
    }

    const node3: SkeletonNode = {
      id: 2,
      position: vec3({ x: 0, y: 4, z: 0 }),
      orientation: identityQuat(),
      radius: 0.6,
      parentId: 1,
      depth: 0,
      isTerminal: true,
      isBranchPoint: false,
    }

    const segment1: SkeletonSegment = {
      startNodeId: 0,
      endNodeId: 1,
      startRadius: 1.0,
      endRadius: 0.8,
      length: 2.0,
    }

    const segment2: SkeletonSegment = {
      startNodeId: 1,
      endNodeId: 2,
      startRadius: 0.8,
      endRadius: 0.6,
      length: 2.0,
    }

    return {
      nodes: [node1, node2, node3],
      segments: [segment1, segment2],
      leaves: [],
    }
  }

  /**
   * Test that buildBranchGeometry generates geometry for a single segment.
   * Should create positions, normals, uvs, and indices arrays.
   */
  it('generates geometry for single segment', () => {
    const skeleton = createSimpleSkeleton()
    const config = {
      radialSegments: 8,
      textureRepeatY: 1.0,
    }

    const geometry = buildBranchGeometry({ skeleton, config })

    // Should have Float32Array for positions, normals, uvs
    expect(geometry.positions).toBeInstanceOf(Float32Array)
    expect(geometry.normals).toBeInstanceOf(Float32Array)
    expect(geometry.uvs).toBeInstanceOf(Float32Array)
    expect(geometry.indices).toBeInstanceOf(Uint32Array)

    // Should have non-zero length arrays
    expect(geometry.positions.length).toBeGreaterThan(0)
    expect(geometry.normals.length).toBeGreaterThan(0)
    expect(geometry.uvs.length).toBeGreaterThan(0)
    expect(geometry.indices.length).toBeGreaterThan(0)

    // Positions should have 3 components per vertex
    // Normals should match positions length
    expect(geometry.normals.length).toBe(geometry.positions.length)

    // UVs should have 2 components per vertex (2/3 of positions)
    expect(geometry.uvs.length).toBe((geometry.positions.length / 3) * 2)
  })

  /**
   * Test that more segments produce more geometry.
   * A skeleton with 2 segments should have more vertices than one with 1 segment.
   */
  it('generates more geometry for more segments', () => {
    const singleSegmentSkeleton = createSimpleSkeleton()
    const multiSegmentSkeleton = createMultiSegmentSkeleton()
    const config = {
      radialSegments: 8,
      textureRepeatY: 1.0,
    }

    const singleGeometry = buildBranchGeometry({
      skeleton: singleSegmentSkeleton,
      config,
    })
    const multiGeometry = buildBranchGeometry({
      skeleton: multiSegmentSkeleton,
      config,
    })

    // Multi-segment skeleton should have more vertices
    expect(multiGeometry.positions.length).toBeGreaterThan(
      singleGeometry.positions.length
    )

    // Multi-segment skeleton should have more indices
    expect(multiGeometry.indices.length).toBeGreaterThan(
      singleGeometry.indices.length
    )
  })

  /**
   * Test that radialSegments config affects vertex count.
   * More radial segments = more vertices per ring.
   */
  it('radialSegments affects vertex count', () => {
    const skeleton = createSimpleSkeleton()

    const geometry4 = buildBranchGeometry({
      skeleton,
      config: { radialSegments: 4, textureRepeatY: 1.0 },
    })

    const geometry8 = buildBranchGeometry({
      skeleton,
      config: { radialSegments: 8, textureRepeatY: 1.0 },
    })

    // 8 radial segments should produce twice as many vertices as 4
    expect(geometry8.positions.length).toBe(geometry4.positions.length * 2)
  })
})
