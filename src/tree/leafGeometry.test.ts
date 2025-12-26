/**
 * Unit tests for leaf geometry builder.
 * Following TDD: tests written first, then implementation.
 */

import { describe, expect, it } from 'bun:test'
import { createLeafShape, buildLeafInstances } from './leafGeometry'
import type { LeafPoint, LeafShapeConfig, LeafInstanceConfig } from './skeleton'

describe('Leaf Geometry Builder', () => {
  describe('createLeafShape', () => {
    // Test 1: createLeafShape creates geometry with correct structure
    it('creates geometry with correct structure', () => {
      const config: LeafShapeConfig = {
        width: 0.5,
        length: 1.0,
        curvature: 0.2,
        segments: 4,
      }

      const result = createLeafShape({ config })

      // Should return GeometryData with all required properties
      expect(result.positions).toBeInstanceOf(Float32Array)
      expect(result.normals).toBeInstanceOf(Float32Array)
      expect(result.uvs).toBeInstanceOf(Float32Array)
      expect(result.indices).toBeInstanceOf(Uint32Array)

      // With 4 segments, we have 5 rows of 2 vertices = 10 vertices
      // Each vertex has 3 position components
      expect(result.positions.length).toBe(10 * 3)

      // Should have indices for triangles
      // 4 segments * 2 triangles per segment * 3 indices per triangle = 24
      expect(result.indices.length).toBe(24)
    })

    // Test 2: createLeafShape has matching position and normal counts
    it('has matching position and normal counts', () => {
      const config: LeafShapeConfig = {
        width: 0.5,
        length: 1.0,
        curvature: 0.1,
        segments: 6,
      }

      const result = createLeafShape({ config })

      // Normals should have same count as positions (one normal per vertex)
      expect(result.normals.length).toBe(result.positions.length)
    })

    // Test 3: createLeafShape has correct UV count
    it('has correct UV count', () => {
      const config: LeafShapeConfig = {
        width: 0.3,
        length: 0.8,
        curvature: 0.15,
        segments: 5,
      }

      const result = createLeafShape({ config })

      // UVs have 2 components per vertex, positions have 3
      // So UV count should be 2/3 of position count
      const vertexCount = result.positions.length / 3
      expect(result.uvs.length).toBe(vertexCount * 2)
    })

    // Test 4: createLeafShape vertices stay within expected bounds
    it('vertices stay within expected bounds', () => {
      const config: LeafShapeConfig = {
        width: 0.5,
        length: 1.0,
        curvature: 0.3,
        segments: 4,
      }

      const result = createLeafShape({ config })

      // Check all vertices are within expected bounds
      for (let i = 0; i < result.positions.length; i += 3) {
        const x = result.positions[i]
        const y = result.positions[i + 1]
        const z = result.positions[i + 2]

        // X should be within [-width/2, width/2]
        expect(x).toBeGreaterThanOrEqual(-config.width / 2)
        expect(x).toBeLessThanOrEqual(config.width / 2)

        // Y should be within [0, length]
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(config.length)

        // Z (curvature) should be reasonable - not exceed curvature * length
        expect(Math.abs(z)).toBeLessThanOrEqual(
          config.curvature * config.length + 0.001
        )
      }
    })
  })

  describe('buildLeafInstances', () => {
    // Test 5: buildLeafInstances generates correct number of matrices
    it('generates correct number of matrices', () => {
      const leaves: LeafPoint[] = [
        {
          position: { x: 0, y: 1, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
          size: 1.0,
        },
        {
          position: { x: 1, y: 2, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
          size: 0.8,
        },
        {
          position: { x: -1, y: 3, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
          size: 1.2,
        },
      ]

      const config: LeafInstanceConfig = {
        baseColor: { r: 0.2, g: 0.6, b: 0.2 },
        colorVariation: 0.1,
        sizeVariation: 0.2,
        rotationScatter: 0.3,
        seed: 'test-seed',
      }

      const result = buildLeafInstances({ leaves, config })

      // 3 leaves * 16 floats per 4x4 matrix = 48 floats
      expect(result.matrices.length).toBe(48)
      // 3 leaves * 3 floats per RGB color = 9 floats
      expect(result.colors.length).toBe(9)
      expect(result.count).toBe(3)
    })

    // Test 6: buildLeafInstances returns empty data for no leaves
    it('returns empty data for no leaves', () => {
      const leaves: LeafPoint[] = []

      const config: LeafInstanceConfig = {
        baseColor: { r: 0.2, g: 0.6, b: 0.2 },
        colorVariation: 0.1,
        sizeVariation: 0.2,
        rotationScatter: 0.3,
        seed: 'test-seed',
      }

      const result = buildLeafInstances({ leaves, config })

      expect(result.matrices.length).toBe(0)
      expect(result.colors.length).toBe(0)
      expect(result.count).toBe(0)
    })

    // Test 7: buildLeafInstances colors stay within valid range
    it('colors stay within valid range', () => {
      const leaves: LeafPoint[] = []
      // Create many leaves to test color variation
      for (let i = 0; i < 100; i++) {
        leaves.push({
          position: { x: i * 0.1, y: i * 0.2, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
          size: 1.0,
        })
      }

      const config: LeafInstanceConfig = {
        baseColor: { r: 0.2, g: 0.6, b: 0.2 },
        colorVariation: 0.5, // Large variation to test clamping
        sizeVariation: 0.2,
        rotationScatter: 0.3,
        seed: 'color-test',
      }

      const result = buildLeafInstances({ leaves, config })

      // All color components should be clamped to [0, 1]
      for (let i = 0; i < result.colors.length; i++) {
        expect(result.colors[i]).toBeGreaterThanOrEqual(0)
        expect(result.colors[i]).toBeLessThanOrEqual(1)
      }
    })

    // Test 8: buildLeafInstances produces deterministic results for same seed
    it('produces deterministic results for same seed', () => {
      const leaves: LeafPoint[] = [
        {
          position: { x: 0, y: 1, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
          size: 1.0,
        },
        {
          position: { x: 1, y: 2, z: 0.5 },
          orientation: { x: 0.1, y: 0, z: 0, w: 0.995 },
          size: 0.9,
        },
      ]

      const config: LeafInstanceConfig = {
        baseColor: { r: 0.3, g: 0.5, b: 0.2 },
        colorVariation: 0.15,
        sizeVariation: 0.25,
        rotationScatter: 0.4,
        seed: 'determinism-test',
      }

      // Run twice with same inputs
      const result1 = buildLeafInstances({ leaves, config })
      const result2 = buildLeafInstances({ leaves, config })

      // Results should be identical
      expect(result1.count).toBe(result2.count)

      for (let i = 0; i < result1.matrices.length; i++) {
        expect(result1.matrices[i]).toBe(result2.matrices[i])
      }

      for (let i = 0; i < result1.colors.length; i++) {
        expect(result1.colors[i]).toBe(result2.colors[i])
      }
    })
  })
})
