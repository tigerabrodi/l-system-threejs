/**
 * Quaternion Math Utilities
 *
 * Provides quaternion operations for 3D rotations.
 * Quaternions are a mathematical representation of rotations that avoid gimbal lock
 * and provide smooth interpolation between orientations.
 *
 * A quaternion q = w + xi + yj + zk where:
 * - w is the scalar (real) component
 * - x, y, z are the vector (imaginary) components
 *
 * All functions follow a consistent API pattern using object parameters for type safety.
 */

import { addVec3, crossVec3, scaleVec3 } from './math'
import type { Vec3 } from './math'

/**
 * Represents a quaternion with x, y, z (vector) and w (scalar) components.
 * Unit quaternions (length = 1) represent rotations in 3D space.
 */
export interface Quat {
  x: number
  y: number
  z: number
  w: number
}

/**
 * Creates a new quaternion from the given components.
 *
 * @param params - Object containing x, y, z, w components
 * @returns A new Quat object
 */
export function quat(params: {
  x: number
  y: number
  z: number
  w: number
}): Quat {
  return {
    x: params.x,
    y: params.y,
    z: params.z,
    w: params.w,
  }
}

/**
 * Creates the identity quaternion representing no rotation.
 * The identity quaternion has the form (0, 0, 0, 1).
 *
 * @returns The identity quaternion
 */
export function identityQuat(): Quat {
  return {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  }
}

/**
 * Multiplies two quaternions together.
 * This operation combines rotations. The result represents applying rotation 'a' first,
 * then rotation 'b'. Note: quaternion multiplication is NOT commutative (a*b != b*a).
 *
 * Formula:
 *   result.x = a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y
 *   result.y = a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x
 *   result.z = a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w
 *   result.w = a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z
 *
 * @param params - Object containing quaternions a and b to multiply
 * @returns A new Quat representing the combined rotation (a then b)
 */
export function multiplyQuat(params: { a: Quat; b: Quat }): Quat {
  const { a, b } = params

  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

/**
 * Normalizes a quaternion to unit length.
 * Unit quaternions are required for representing pure rotations.
 * If the input quaternion has zero length, returns the identity quaternion.
 *
 * @param params - Object containing quaternion q to normalize
 * @returns A new Quat with unit length
 */
export function normalizeQuat(params: { q: Quat }): Quat {
  const { q } = params

  // Calculate the length (magnitude) of the quaternion
  const length = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)

  // Handle zero-length quaternion to avoid division by zero
  if (length === 0) {
    return identityQuat()
  }

  // Divide each component by the length
  return {
    x: q.x / length,
    y: q.y / length,
    z: q.z / length,
    w: q.w / length,
  }
}

/**
 * Creates a rotation quaternion from an axis and angle.
 * The axis should be a unit vector for correct results.
 *
 * Formula:
 *   w = cos(angle / 2)
 *   xyz = axis * sin(angle / 2)
 *
 * @param params - Object containing the rotation axis (Vec3) and angle in radians
 * @returns A unit quaternion representing the rotation
 */
export function quatFromAxisAngle(params: { axis: Vec3; angle: number }): Quat {
  const { axis, angle } = params

  // Calculate half angle for quaternion formula
  const halfAngle = angle / 2
  const sinHalfAngle = Math.sin(halfAngle)
  const cosHalfAngle = Math.cos(halfAngle)

  return {
    x: axis.x * sinHalfAngle,
    y: axis.y * sinHalfAngle,
    z: axis.z * sinHalfAngle,
    w: cosHalfAngle,
  }
}

/**
 * Rotates a 3D vector by a quaternion.
 * The quaternion should be a unit quaternion for correct rotation results.
 *
 * This uses the optimized formula:
 *   v' = v + 2*w*(qv x v) + 2*(qv x (qv x v))
 * where qv is the vector part of q (x, y, z).
 *
 * Equivalent to the standard formula: v' = q * v * q^-1
 * For unit quaternions, q^-1 = conjugate = (-x, -y, -z, w)
 *
 * @param params - Object containing vector v to rotate and quaternion q
 * @returns A new Vec3 representing the rotated vector
 */
export function rotateVec3ByQuat(params: { v: Vec3; q: Quat }): Vec3 {
  const { v, q } = params

  // Extract the vector part of the quaternion
  const qv: Vec3 = { x: q.x, y: q.y, z: q.z }

  // Calculate qv x v (first cross product)
  const cross1 = crossVec3({ a: qv, b: v })

  // Calculate qv x (qv x v) (second cross product)
  const cross2 = crossVec3({ a: qv, b: cross1 })

  // v' = v + 2*w*(qv x v) + 2*(qv x (qv x v))
  // First term: 2*w*(qv x v)
  const term1 = scaleVec3({ v: cross1, s: 2 * q.w })

  // Second term: 2*(qv x (qv x v))
  const term2 = scaleVec3({ v: cross2, s: 2 })

  // Combine: v + term1 + term2
  const result = addVec3({ a: addVec3({ a: v, b: term1 }), b: term2 })

  return result
}
