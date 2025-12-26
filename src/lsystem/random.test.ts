/**
 * Tests for the seeded random number generator module.
 * Uses TDD approach - these tests were written before the implementation.
 */

import { describe, expect, it } from 'bun:test'
import { createRandom } from './random'

describe('createRandom', () => {
  describe('determinism', () => {
    it('produces deterministic sequence from same seed', () => {
      // Two generators with the same seed should produce identical sequences
      const rng1 = createRandom({ seed: 'test-seed-123' })
      const rng2 = createRandom({ seed: 'test-seed-123' })

      // Generate several values and verify they match
      for (let i = 0; i < 10; i++) {
        expect(rng1.random()).toBe(rng2.random())
      }
    })

    it('produces different sequences from different seeds', () => {
      // Two generators with different seeds should produce different sequences
      const rng1 = createRandom({ seed: 'seed-alpha' })
      const rng2 = createRandom({ seed: 'seed-beta' })

      // Collect values from both generators
      const values1: number[] = []
      const values2: number[] = []

      for (let i = 0; i < 10; i++) {
        values1.push(rng1.random())
        values2.push(rng2.random())
      }

      // The sequences should not be equal
      const allEqual = values1.every((v, i) => v === values2[i])
      expect(allEqual).toBe(false)
    })
  })

  describe('random()', () => {
    it('returns values between 0 and 1', () => {
      const rng = createRandom({ seed: 'bounds-test' })

      // Generate many values and verify they're all in range
      for (let i = 0; i < 1000; i++) {
        const value = rng.random()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })
  })

  describe('randomRange()', () => {
    it('respects bounds', () => {
      const rng = createRandom({ seed: 'range-test' })
      const min = 10
      const max = 20

      // Generate many values and verify they're all within bounds
      for (let i = 0; i < 1000; i++) {
        const value = rng.randomRange({ min, max })
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThan(max)
      }
    })

    it('works with negative ranges', () => {
      const rng = createRandom({ seed: 'negative-range' })
      const min = -50
      const max = -10

      for (let i = 0; i < 100; i++) {
        const value = rng.randomRange({ min, max })
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThan(max)
      }
    })
  })

  describe('randomInt()', () => {
    it('returns integers within range inclusive', () => {
      const rng = createRandom({ seed: 'int-test' })
      const min = 1
      const max = 6

      const results = new Set<number>()

      // Generate many values to ensure we hit all possibilities
      for (let i = 0; i < 1000; i++) {
        const value = rng.randomInt({ min, max })

        // Verify it's an integer
        expect(Number.isInteger(value)).toBe(true)

        // Verify bounds (inclusive on both ends)
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThanOrEqual(max)

        results.add(value)
      }

      // With 1000 iterations, we should have hit all 6 possible values (1-6)
      expect(results.size).toBe(6)
    })

    it('works when min equals max', () => {
      const rng = createRandom({ seed: 'single-value' })

      // When min equals max, should always return that value
      for (let i = 0; i < 10; i++) {
        expect(rng.randomInt({ min: 5, max: 5 })).toBe(5)
      }
    })
  })

  describe('randomChoice()', () => {
    it('returns element from array', () => {
      const rng = createRandom({ seed: 'choice-test' })
      const options = ['apple', 'banana', 'cherry', 'date']

      const results = new Set<string>()

      // Generate many choices
      for (let i = 0; i < 1000; i++) {
        const choice = rng.randomChoice({ array: options })

        // Verify it's one of the valid options
        expect(options).toContain(choice)

        results.add(choice)
      }

      // With 1000 iterations, we should have selected each option at least once
      expect(results.size).toBe(options.length)
    })

    it('works with single element array', () => {
      const rng = createRandom({ seed: 'single-choice' })

      for (let i = 0; i < 10; i++) {
        expect(rng.randomChoice({ array: [42] })).toBe(42)
      }
    })

    it('works with objects', () => {
      const rng = createRandom({ seed: 'object-choice' })
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }]

      const choice = rng.randomChoice({ array: objects })
      expect(objects).toContain(choice)
    })
  })

  describe('randomChance()', () => {
    it('respects probability', () => {
      const rng = createRandom({ seed: 'chance-test' })
      const probability = 0.3
      const iterations = 10000

      let successes = 0
      for (let i = 0; i < iterations; i++) {
        if (rng.randomChance({ probability })) {
          successes++
        }
      }

      // The actual ratio should be close to the probability
      // Allow 5% tolerance for statistical variance
      const actualRatio = successes / iterations
      expect(actualRatio).toBeGreaterThan(probability - 0.05)
      expect(actualRatio).toBeLessThan(probability + 0.05)
    })

    it('returns false for probability 0', () => {
      const rng = createRandom({ seed: 'zero-chance' })

      for (let i = 0; i < 100; i++) {
        expect(rng.randomChance({ probability: 0 })).toBe(false)
      }
    })

    it('returns true for probability 1', () => {
      const rng = createRandom({ seed: 'certain-chance' })

      for (let i = 0; i < 100; i++) {
        expect(rng.randomChance({ probability: 1 })).toBe(true)
      }
    })
  })
})
