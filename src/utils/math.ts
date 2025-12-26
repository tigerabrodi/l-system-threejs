/**
 * Vector Math Utilities
 *
 * Provides common 3D vector operations for use in graphics and physics calculations.
 * All functions follow a consistent API pattern using object parameters for type safety.
 */

/**
 * Represents a 3D vector with x, y, and z components.
 */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * Creates a new 3D vector from the given components.
 *
 * @param params - Object containing x, y, z coordinates
 * @returns A new Vec3 object
 */
export function vec3(params: { x: number; y: number; z: number }): Vec3 {
  return {
    x: params.x,
    y: params.y,
    z: params.z,
  }
}

/**
 * Adds two vectors component-wise.
 *
 * @param params - Object containing vectors a and b to add
 * @returns A new Vec3 representing a + b
 */
export function addVec3(params: { a: Vec3; b: Vec3 }): Vec3 {
  const { a, b } = params
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }
}

/**
 * Subtracts vector b from vector a component-wise.
 *
 * @param params - Object containing vectors a and b (computes a - b)
 * @returns A new Vec3 representing a - b
 */
export function subVec3(params: { a: Vec3; b: Vec3 }): Vec3 {
  const { a, b } = params
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

/**
 * Scales a vector by a scalar value.
 *
 * @param params - Object containing vector v and scalar s
 * @returns A new Vec3 representing v * s
 */
export function scaleVec3(params: { v: Vec3; s: number }): Vec3 {
  const { v, s } = params
  return {
    x: v.x * s,
    y: v.y * s,
    z: v.z * s,
  }
}

/**
 * Computes the Euclidean length (magnitude) of a vector.
 * Uses the formula: sqrt(x^2 + y^2 + z^2)
 *
 * @param params - Object containing vector v
 * @returns The length of the vector
 */
export function lengthVec3(params: { v: Vec3 }): number {
  const { v } = params
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

/**
 * Normalizes a vector to unit length (magnitude of 1).
 * If the input vector has zero length, returns a zero vector to avoid division by zero.
 *
 * @param params - Object containing vector v to normalize
 * @returns A new Vec3 with unit length, or zero vector if input is zero
 */
export function normalizeVec3(params: { v: Vec3 }): Vec3 {
  const { v } = params
  const len = lengthVec3({ v })

  // Handle zero vector case to avoid division by zero
  if (len === 0) {
    return { x: 0, y: 0, z: 0 }
  }

  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len,
  }
}

/**
 * Computes the cross product of two vectors.
 * The cross product produces a vector perpendicular to both input vectors.
 * Formula: (a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x)
 *
 * @param params - Object containing vectors a and b
 * @returns A new Vec3 representing a × b
 */
export function crossVec3(params: { a: Vec3; b: Vec3 }): Vec3 {
  const { a, b } = params
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

/**
 * Computes the dot product of two vectors.
 * The dot product is a scalar value representing the projection of one vector onto another.
 * Formula: a.x*b.x + a.y*b.y + a.z*b.z
 *
 * @param params - Object containing vectors a and b
 * @returns The dot product (scalar value)
 */
export function dotVec3(params: { a: Vec3; b: Vec3 }): number {
  const { a, b } = params
  return a.x * b.x + a.y * b.y + a.z * b.z
}

/**
 * Computes the Euclidean distance between two points in 3D space.
 * Uses the formula: sqrt((b.x-a.x)^2 + (b.y-a.y)^2 + (b.z-a.z)^2)
 *
 * @param params - Object containing points a and b
 * @returns The distance between the two points
 */
export function distanceVec3(params: { a: Vec3; b: Vec3 }): number {
  const { a, b } = params
  // Compute the difference vector and return its length
  const diff = subVec3({ a: b, b: a })
  return lengthVec3({ v: diff })
}

/**
 * Performs linear interpolation (lerp) between two vectors.
 * When t=0, returns a. When t=1, returns b. Values between 0-1 interpolate linearly.
 * Formula: a + (b - a) * t
 *
 * @param params - Object containing vectors a, b and interpolation factor t (0 to 1)
 * @returns A new Vec3 representing the interpolated point
 */
export function lerpVec3(params: { a: Vec3; b: Vec3; t: number }): Vec3 {
  const { a, b, t } = params
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }
}
