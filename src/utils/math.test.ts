/**
 * Unit tests for vector math utilities.
 * Following TDD: tests written first, then implementation.
 */

import { describe, expect, it } from 'bun:test'
import {
  addVec3,
  crossVec3,
  distanceVec3,
  dotVec3,
  lengthVec3,
  lerpVec3,
  normalizeVec3,
  scaleVec3,
  subVec3,
  Vec3,
  vec3,
} from './math'

describe('Vector Math Utilities', () => {
  // Test 1: vec3 creates vector with components
  it('vec3 creates vector with components', () => {
    const v = vec3({ x: 1, y: 2, z: 3 })

    expect(v.x).toBe(1)
    expect(v.y).toBe(2)
    expect(v.z).toBe(3)
  })

  // Test 2: addVec3 adds two vectors
  it('addVec3 adds two vectors', () => {
    const a: Vec3 = { x: 1, y: 2, z: 3 }
    const b: Vec3 = { x: 4, y: 5, z: 6 }

    const result = addVec3({ a, b })

    expect(result.x).toBe(5)
    expect(result.y).toBe(7)
    expect(result.z).toBe(9)
  })

  // Test 3: subVec3 subtracts vectors
  it('subVec3 subtracts vectors', () => {
    const a: Vec3 = { x: 5, y: 7, z: 9 }
    const b: Vec3 = { x: 1, y: 2, z: 3 }

    const result = subVec3({ a, b })

    expect(result.x).toBe(4)
    expect(result.y).toBe(5)
    expect(result.z).toBe(6)
  })

  // Test 4: scaleVec3 scales vector by scalar
  it('scaleVec3 scales vector by scalar', () => {
    const v: Vec3 = { x: 1, y: 2, z: 3 }

    const result = scaleVec3({ v, s: 2 })

    expect(result.x).toBe(2)
    expect(result.y).toBe(4)
    expect(result.z).toBe(6)
  })

  // Test 5: lengthVec3 computes vector length (test with 3,4,0 = 5)
  it('lengthVec3 computes vector length', () => {
    const v: Vec3 = { x: 3, y: 4, z: 0 }

    const result = lengthVec3({ v })

    // sqrt(3^2 + 4^2 + 0^2) = sqrt(9 + 16) = sqrt(25) = 5
    expect(result).toBe(5)
  })

  // Test 6: normalizeVec3 normalizes to unit length
  it('normalizeVec3 normalizes to unit length', () => {
    const v: Vec3 = { x: 3, y: 4, z: 0 }

    const result = normalizeVec3({ v })

    // Original length is 5, so normalized is (3/5, 4/5, 0)
    expect(result.x).toBeCloseTo(0.6)
    expect(result.y).toBeCloseTo(0.8)
    expect(result.z).toBeCloseTo(0)

    // Verify unit length
    const normalizedLength = lengthVec3({ v: result })
    expect(normalizedLength).toBeCloseTo(1)
  })

  // Test 7: normalizeVec3 handles zero vector
  it('normalizeVec3 handles zero vector', () => {
    const v: Vec3 = { x: 0, y: 0, z: 0 }

    const result = normalizeVec3({ v })

    // Should return zero vector when input is zero
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.z).toBe(0)
  })

  // Test 8: crossVec3 computes cross product (X cross Y = Z)
  it('crossVec3 computes cross product', () => {
    const xAxis: Vec3 = { x: 1, y: 0, z: 0 }
    const yAxis: Vec3 = { x: 0, y: 1, z: 0 }

    const result = crossVec3({ a: xAxis, b: yAxis })

    // X cross Y should equal Z
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.z).toBe(1)
  })

  // Test 9: dotVec3 computes dot product
  it('dotVec3 computes dot product', () => {
    const a: Vec3 = { x: 1, y: 2, z: 3 }
    const b: Vec3 = { x: 4, y: 5, z: 6 }

    const result = dotVec3({ a, b })

    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    expect(result).toBe(32)
  })

  // Test 10: dotVec3 returns 0 for perpendicular vectors
  it('dotVec3 returns 0 for perpendicular vectors', () => {
    const xAxis: Vec3 = { x: 1, y: 0, z: 0 }
    const yAxis: Vec3 = { x: 0, y: 1, z: 0 }

    const result = dotVec3({ a: xAxis, b: yAxis })

    // Perpendicular vectors have dot product of 0
    expect(result).toBe(0)
  })

  // Test 11: distanceVec3 computes distance between points
  it('distanceVec3 computes distance between points', () => {
    const a: Vec3 = { x: 0, y: 0, z: 0 }
    const b: Vec3 = { x: 3, y: 4, z: 0 }

    const result = distanceVec3({ a, b })

    // Distance should be 5 (3-4-5 triangle)
    expect(result).toBe(5)
  })

  // Test 12: lerpVec3 interpolates between vectors
  it('lerpVec3 interpolates between vectors', () => {
    const a: Vec3 = { x: 0, y: 0, z: 0 }
    const b: Vec3 = { x: 10, y: 20, z: 30 }

    // Test at t=0 (should return a)
    const atStart = lerpVec3({ a, b, t: 0 })
    expect(atStart.x).toBe(0)
    expect(atStart.y).toBe(0)
    expect(atStart.z).toBe(0)

    // Test at t=1 (should return b)
    const atEnd = lerpVec3({ a, b, t: 1 })
    expect(atEnd.x).toBe(10)
    expect(atEnd.y).toBe(20)
    expect(atEnd.z).toBe(30)

    // Test at t=0.5 (should return midpoint)
    const atMid = lerpVec3({ a, b, t: 0.5 })
    expect(atMid.x).toBe(5)
    expect(atMid.y).toBe(10)
    expect(atMid.z).toBe(15)
  })
})
