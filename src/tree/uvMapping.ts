/**
 * UV Mapping Utilities for Bark Texture
 *
 * These utilities handle UV coordinate calculation for cylindrical branch geometry.
 * The UV mapping ensures seamless texture wrapping around branches and continuity
 * along the trunk from segment to segment.
 */

/**
 * Represents a 2D UV coordinate for texture mapping.
 * U typically wraps horizontally (around circumference), V goes vertically (along length).
 */
export interface UV {
  u: number
  v: number
}

/**
 * Basic information about a branch segment needed for UV calculations.
 */
export interface SegmentInfo {
  length: number
}

/**
 * Parameters for calculating UV coordinates on a branch ring vertex.
 */
interface CalculateBranchUVParams {
  ringIndex: number // which ring (0 at start of segment)
  vertexIndex: number // position around the ring (0 to radialSegments-1)
  totalRings: number // total rings in this segment
  radialSegments: number // vertices per ring
  segmentLength: number // world length of this segment
  textureScale: number // texture tiles per world unit
  vOffset: number // cumulative V from previous segments
}

/**
 * Parameters for calculating the cumulative V offset for a segment.
 */
interface CalculateVOffsetParams {
  segmentIndex: number // which segment (0-based)
  segments: SegmentInfo[] // all segments with their lengths
  textureScale: number // texture tiles per world unit
}

/**
 * Calculate UV coordinates for a vertex on a branch ring.
 *
 * U wraps around the circumference (0-1), V goes along the branch length.
 * This creates a cylindrical mapping where the texture wraps seamlessly
 * around the branch and tiles along its length.
 *
 * Formula:
 * - U = vertexIndex / radialSegments (wraps 0 to 1 around circumference)
 * - V = vOffset + (ringIndex / (totalRings - 1)) * segmentLength * textureScale
 *
 * @param params - Object containing all UV calculation parameters
 * @returns UV coordinates for the specified vertex
 */
export function calculateBranchUV(params: CalculateBranchUVParams): UV {
  const {
    ringIndex,
    vertexIndex,
    totalRings,
    radialSegments,
    segmentLength,
    textureScale,
    vOffset,
  } = params

  // U coordinate: wraps around the circumference from 0 to 1
  // vertexIndex 0 -> u = 0, vertexIndex = radialSegments -> u = 1
  const u = vertexIndex / radialSegments

  // V coordinate: progresses along the segment length
  // ringIndex 0 -> local v = 0, ringIndex = totalRings-1 -> local v = segmentLength * textureScale
  // We add vOffset to maintain continuity with previous segments
  const ringProgress = totalRings > 1 ? ringIndex / (totalRings - 1) : 0
  const v = vOffset + ringProgress * segmentLength * textureScale

  return { u, v }
}

/**
 * Calculate the cumulative V offset for a segment based on previous segments.
 *
 * This ensures texture continuity along the trunk by accumulating the V range
 * used by all previous segments. Each segment's contribution to V is its
 * length multiplied by the texture scale.
 *
 * Formula:
 * - vOffset for segment N = sum of (length * textureScale) for segments 0 to N-1
 *
 * @param params - Object containing segment index, all segments, and texture scale
 * @returns The cumulative V offset to use for the specified segment
 */
export function calculateVOffset(params: CalculateVOffsetParams): number {
  const { segmentIndex, segments, textureScale } = params

  // First segment always starts at V = 0
  if (segmentIndex === 0) {
    return 0
  }

  // Accumulate V range from all previous segments
  // Each segment contributes (length * textureScale) to the total V range
  let offset = 0
  for (let i = 0; i < segmentIndex; i++) {
    offset += segments[i].length * textureScale
  }

  return offset
}
