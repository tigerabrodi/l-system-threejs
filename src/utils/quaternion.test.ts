/**
 * Quaternion Math Utilities - Tests
 *
 * Tests for quaternion operations including creation, multiplication,
 * normalization, axis-angle conversion, and vector rotation.
 */

import { describe, expect, test } from 'bun:test'
import { vec3 } from './math'
import {
  identityQuat,
  multiplyQuat,
  normalizeQuat,
  quat,
  quatFromAxisAngle,
  rotateVec3ByQuat,
} from './quaternion'

describe('Quaternion Math Utilities', () => {
  // Test 1: quat creates quaternion with components
  test('quat creates quaternion with components', () => {
    const q = quat({ x: 1, y: 2, z: 3, w: 4 })

    expect(q.x).toBe(1)
    expect(q.y).toBe(2)
    expect(q.z).toBe(3)
    expect(q.w).toBe(4)
  })

  // Test 2: identityQuat returns identity quaternion
  test('identityQuat returns identity quaternion', () => {
    const q = identityQuat()

    expect(q.x).toBe(0)
    expect(q.y).toBe(0)
    expect(q.z).toBe(0)
    expect(q.w).toBe(1)
  })

  // Test 3: quatFromAxisAngle creates identity for zero angle
  test('quatFromAxisAngle creates identity for zero angle', () => {
    const axis = vec3({ x: 0, y: 1, z: 0 })
    const q = quatFromAxisAngle({ axis, angle: 0 })

    // For zero angle: w = cos(0) = 1, xyz = axis * sin(0) = 0
    expect(q.x).toBe(0)
    expect(q.y).toBe(0)
    expect(q.z).toBe(0)
    expect(q.w).toBe(1)
  })

  // Test 4: quatFromAxisAngle creates 90 degree rotation around Y axis
  test('quatFromAxisAngle creates 90 degree rotation', () => {
    const axis = vec3({ x: 0, y: 1, z: 0 })
    const angle = Math.PI / 2 // 90 degrees

    const q = quatFromAxisAngle({ axis, angle })

    // For 90 degree rotation: w = cos(45°) = sqrt(2)/2, y = sin(45°) = sqrt(2)/2
    const expected = Math.sqrt(2) / 2
    expect(q.x).toBeCloseTo(0, 10)
    expect(q.y).toBeCloseTo(expected, 10)
    expect(q.z).toBeCloseTo(0, 10)
    expect(q.w).toBeCloseTo(expected, 10)
  })

  // Test 5: multiplyQuat - identity times anything equals anything
  test('multiplyQuat - identity times anything equals anything', () => {
    const identity = identityQuat()
    const q = quat({ x: 0.5, y: 0.5, z: 0.5, w: 0.5 })

    // Identity * q should equal q
    const result1 = multiplyQuat({ a: identity, b: q })
    expect(result1.x).toBeCloseTo(q.x, 10)
    expect(result1.y).toBeCloseTo(q.y, 10)
    expect(result1.z).toBeCloseTo(q.z, 10)
    expect(result1.w).toBeCloseTo(q.w, 10)

    // q * Identity should also equal q
    const result2 = multiplyQuat({ a: q, b: identity })
    expect(result2.x).toBeCloseTo(q.x, 10)
    expect(result2.y).toBeCloseTo(q.y, 10)
    expect(result2.z).toBeCloseTo(q.z, 10)
    expect(result2.w).toBeCloseTo(q.w, 10)
  })

  // Test 6: multiplyQuat combines rotations correctly - two 90° rotations = 180°
  test('multiplyQuat combines rotations correctly', () => {
    const axis = vec3({ x: 0, y: 1, z: 0 })
    const angle90 = Math.PI / 2 // 90 degrees

    const q90 = quatFromAxisAngle({ axis, angle: angle90 })

    // Two 90° rotations should equal one 180° rotation
    const q180Combined = multiplyQuat({ a: q90, b: q90 })

    // Create a direct 180° rotation for comparison
    const q180Direct = quatFromAxisAngle({ axis, angle: Math.PI })

    // The quaternions should be equivalent (or negatives, which represent the same rotation)
    // For 180° around Y: w = cos(90°) = 0, y = sin(90°) = 1
    expect(Math.abs(q180Combined.x)).toBeCloseTo(Math.abs(q180Direct.x), 10)
    expect(Math.abs(q180Combined.y)).toBeCloseTo(Math.abs(q180Direct.y), 10)
    expect(Math.abs(q180Combined.z)).toBeCloseTo(Math.abs(q180Direct.z), 10)
    expect(Math.abs(q180Combined.w)).toBeCloseTo(Math.abs(q180Direct.w), 10)
  })

  // Test 7: normalizeQuat normalizes to unit length
  test('normalizeQuat normalizes to unit length', () => {
    // Create a non-unit quaternion
    const q = quat({ x: 1, y: 2, z: 3, w: 4 })

    const normalized = normalizeQuat({ q })

    // Calculate the length of the normalized quaternion
    const length = Math.sqrt(
      normalized.x * normalized.x +
        normalized.y * normalized.y +
        normalized.z * normalized.z +
        normalized.w * normalized.w
    )

    expect(length).toBeCloseTo(1, 10)

    // Verify the direction is preserved (components are proportional)
    const originalLength = Math.sqrt(1 + 4 + 9 + 16) // sqrt(30)
    expect(normalized.x).toBeCloseTo(1 / originalLength, 10)
    expect(normalized.y).toBeCloseTo(2 / originalLength, 10)
    expect(normalized.z).toBeCloseTo(3 / originalLength, 10)
    expect(normalized.w).toBeCloseTo(4 / originalLength, 10)
  })

  // Test 8: rotateVec3ByQuat - identity quaternion does not change vector
  test('rotateVec3ByQuat - identity quaternion does not change vector', () => {
    const v = vec3({ x: 1, y: 2, z: 3 })
    const identity = identityQuat()

    const rotated = rotateVec3ByQuat({ v, q: identity })

    expect(rotated.x).toBeCloseTo(1, 10)
    expect(rotated.y).toBeCloseTo(2, 10)
    expect(rotated.z).toBeCloseTo(3, 10)
  })

  // Test 9: rotateVec3ByQuat - 90 degree rotation around Z rotates X to Y
  test('rotateVec3ByQuat - 90 degree rotation around Z rotates X to Y', () => {
    const v = vec3({ x: 1, y: 0, z: 0 }) // Unit X vector
    const axis = vec3({ x: 0, y: 0, z: 1 }) // Z axis
    const q = quatFromAxisAngle({ axis, angle: Math.PI / 2 }) // 90 degrees

    const rotated = rotateVec3ByQuat({ v, q })

    // X vector rotated 90° around Z should become Y vector
    expect(rotated.x).toBeCloseTo(0, 10)
    expect(rotated.y).toBeCloseTo(1, 10)
    expect(rotated.z).toBeCloseTo(0, 10)
  })

  // Test 10: rotateVec3ByQuat - 180 degree rotation around Y flips X
  test('rotateVec3ByQuat - 180 degree rotation around Y flips X', () => {
    const v = vec3({ x: 1, y: 0, z: 0 }) // Unit X vector
    const axis = vec3({ x: 0, y: 1, z: 0 }) // Y axis
    const q = quatFromAxisAngle({ axis, angle: Math.PI }) // 180 degrees

    const rotated = rotateVec3ByQuat({ v, q })

    // X vector rotated 180° around Y should become -X vector
    expect(rotated.x).toBeCloseTo(-1, 10)
    expect(rotated.y).toBeCloseTo(0, 10)
    expect(rotated.z).toBeCloseTo(0, 10)
  })
})
