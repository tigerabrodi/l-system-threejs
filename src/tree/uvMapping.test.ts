import { describe, expect, it } from 'bun:test'
import { calculateBranchUV, calculateVOffset } from './uvMapping'

describe('calculateBranchUV', () => {
  /**
   * Test that U coordinate wraps correctly around the circumference.
   * U should go from 0 to 1 as vertexIndex goes from 0 to radialSegments.
   */
  it('U wraps from 0 to 1 around circumference', () => {
    const baseParams = {
      ringIndex: 0,
      totalRings: 5,
      radialSegments: 8,
      segmentLength: 1.0,
      textureScale: 1.0,
      vOffset: 0,
    }

    // First vertex should have u ≈ 0
    const firstVertex = calculateBranchUV({ ...baseParams, vertexIndex: 0 })
    expect(firstVertex.u).toBe(0)

    // Middle vertex should have u ≈ 0.5
    const middleVertex = calculateBranchUV({ ...baseParams, vertexIndex: 4 })
    expect(middleVertex.u).toBe(0.5)

    // Last vertex before wrap should approach 1
    const lastVertex = calculateBranchUV({ ...baseParams, vertexIndex: 7 })
    expect(lastVertex.u).toBe(0.875) // 7/8 = 0.875
  })

  /**
   * Test that V coordinate increases along the segment length.
   * Higher ringIndex should result in higher V values.
   */
  it('V increases along segment length', () => {
    const baseParams = {
      vertexIndex: 0,
      totalRings: 5,
      radialSegments: 8,
      segmentLength: 2.0,
      textureScale: 1.0,
      vOffset: 0,
    }

    // First ring should have v = vOffset (0 in this case)
    const firstRing = calculateBranchUV({ ...baseParams, ringIndex: 0 })
    expect(firstRing.v).toBe(0)

    // Middle ring should have v halfway through the segment
    const middleRing = calculateBranchUV({ ...baseParams, ringIndex: 2 })
    // v = 0 + (2 / (5-1)) * 2.0 * 1.0 = 0.5 * 2.0 = 1.0
    expect(middleRing.v).toBe(1.0)

    // Last ring should have v at segment end
    const lastRing = calculateBranchUV({ ...baseParams, ringIndex: 4 })
    // v = 0 + (4 / (5-1)) * 2.0 * 1.0 = 1.0 * 2.0 = 2.0
    expect(lastRing.v).toBe(2.0)
  })

  /**
   * Test that texture scale correctly affects V range.
   * Higher texture scale means more texture repeats, so higher V values.
   */
  it('texture scale affects V range', () => {
    const baseParams = {
      ringIndex: 4, // Last ring
      vertexIndex: 0,
      totalRings: 5,
      radialSegments: 8,
      segmentLength: 2.0,
      vOffset: 0,
    }

    // With textureScale = 1.0, V at end should be segmentLength * 1.0 = 2.0
    const scale1 = calculateBranchUV({ ...baseParams, textureScale: 1.0 })
    expect(scale1.v).toBe(2.0)

    // With textureScale = 2.0, V at end should be segmentLength * 2.0 = 4.0
    const scale2 = calculateBranchUV({ ...baseParams, textureScale: 2.0 })
    expect(scale2.v).toBe(4.0)

    // With textureScale = 0.5, V at end should be segmentLength * 0.5 = 1.0
    const scaleHalf = calculateBranchUV({ ...baseParams, textureScale: 0.5 })
    expect(scaleHalf.v).toBe(1.0)
  })

  /**
   * Test that vOffset is correctly applied to V calculation.
   */
  it('vOffset shifts V values correctly', () => {
    const baseParams = {
      ringIndex: 0,
      vertexIndex: 0,
      totalRings: 5,
      radialSegments: 8,
      segmentLength: 1.0,
      textureScale: 1.0,
    }

    // With vOffset = 0, first ring V should be 0
    const noOffset = calculateBranchUV({ ...baseParams, vOffset: 0 })
    expect(noOffset.v).toBe(0)

    // With vOffset = 3.5, first ring V should be 3.5
    const withOffset = calculateBranchUV({ ...baseParams, vOffset: 3.5 })
    expect(withOffset.v).toBe(3.5)
  })
})

describe('calculateVOffset', () => {
  /**
   * Test that the first segment (index 0) always has zero offset.
   * There are no previous segments to accumulate from.
   */
  it('first segment has zero offset', () => {
    const segments = [{ length: 2.0 }, { length: 1.5 }, { length: 1.0 }]

    const offset = calculateVOffset({
      segmentIndex: 0,
      segments,
      textureScale: 1.0,
    })

    expect(offset).toBe(0)
  })

  /**
   * Test that offsets correctly accumulate from previous segment lengths.
   * vOffset for segment N = sum of (length * textureScale) for segments 0 to N-1.
   */
  it('offset accumulates segment lengths', () => {
    const segments = [{ length: 2.0 }, { length: 1.5 }, { length: 1.0 }]

    // Segment 1: offset = length[0] * scale = 2.0 * 1.0 = 2.0
    const offset1 = calculateVOffset({
      segmentIndex: 1,
      segments,
      textureScale: 1.0,
    })
    expect(offset1).toBe(2.0)

    // Segment 2: offset = (length[0] + length[1]) * scale = (2.0 + 1.5) * 1.0 = 3.5
    const offset2 = calculateVOffset({
      segmentIndex: 2,
      segments,
      textureScale: 1.0,
    })
    expect(offset2).toBe(3.5)
  })

  /**
   * Test that texture scale affects offset calculation.
   */
  it('texture scale affects offset calculation', () => {
    const segments = [{ length: 2.0 }, { length: 1.5 }]

    // With textureScale = 2.0, offset for segment 1 = 2.0 * 2.0 = 4.0
    const offset = calculateVOffset({
      segmentIndex: 1,
      segments,
      textureScale: 2.0,
    })
    expect(offset).toBe(4.0)
  })
})
