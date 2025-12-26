/**
 * Tests for the L-system engine.
 * Following TDD principles - these tests are written first.
 */

import { describe, expect, test } from 'bun:test'
import {
  applyRules,
  createSymbol,
  generateSentence,
  parseProduction,
  selectRule,
} from './engine'
import { createRandom } from './random'
import type { LSystem, LSystemConfig, Rule, Symbol } from './symbols'

/** Helper to create a minimal config for testing */
function createTestConfig(
  overrides: Partial<LSystemConfig> = {}
): LSystemConfig {
  return {
    baseLength: 1.0,
    baseRadius: 0.1,
    lengthFalloff: 0.9,
    radiusFalloff: 0.7,
    branchAngle: 30,
    variability: 0,
    ...overrides,
  }
}

describe('selectRule', () => {
  test('returns only matching rule when one exists', () => {
    const rules: Rule[] = [{ match: 'F', odds: 1.0, produce: 'FF' }]
    const rng = createRandom({ seed: 'test' })

    const result = selectRule({ rules, rng })

    expect(result).toBe(rules[0])
  })

  test('selects probabilistically among multiple rules', () => {
    // Two rules with equal odds
    const rules: Rule[] = [
      { match: 'F', odds: 0.5, produce: 'F[+F]' },
      { match: 'F', odds: 0.5, produce: 'F[-F]' },
    ]

    // Run multiple times with different seeds to verify both rules can be selected
    const selectedProductions = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const rng = createRandom({ seed: `seed-${i}` })
      const result = selectRule({ rules, rng })
      selectedProductions.add(result.produce as string)
    }

    // Both rules should have been selected at least once
    expect(selectedProductions.size).toBe(2)
    expect(selectedProductions.has('F[+F]')).toBe(true)
    expect(selectedProductions.has('F[-F]')).toBe(true)
  })

  test('respects unequal odds', () => {
    // Rule with 90% odds vs rule with 10% odds
    const rules: Rule[] = [
      { match: 'F', odds: 0.9, produce: 'HIGH' },
      { match: 'F', odds: 0.1, produce: 'LOW' },
    ]

    let highCount = 0
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      const rng = createRandom({ seed: `seed-${i}` })
      const result = selectRule({ rules, rng })
      if (result.produce === 'HIGH') highCount++
    }

    // High odds rule should be selected approximately 90% of the time
    // Allow for some variance (80-100% range)
    expect(highCount / iterations).toBeGreaterThan(0.8)
    expect(highCount / iterations).toBeLessThan(1.0)
  })
})

describe('createSymbol', () => {
  test('creates F symbol with length parameter', () => {
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ baseLength: 2.0, variability: 0 })

    const result = createSymbol({
      char: 'F',
      parentParams: {},
      rng,
      config,
      depth: 0,
    })

    expect(result.symbol).toBe('F')
    expect(result.params.length).toBe(2.0)
  })

  test('applies length falloff based on depth', () => {
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({
      baseLength: 1.0,
      lengthFalloff: 0.5,
      variability: 0,
    })

    // At depth 0, length should be baseLength * (0.5^0) = 1.0
    const depth0 = createSymbol({
      char: 'F',
      parentParams: {},
      rng,
      config,
      depth: 0,
    })
    expect(depth0.params.length).toBe(1.0)

    // At depth 1, length should be baseLength * (0.5^1) = 0.5
    const depth1 = createSymbol({
      char: 'F',
      parentParams: {},
      rng,
      config,
      depth: 1,
    })
    expect(depth1.params.length).toBe(0.5)

    // At depth 2, length should be baseLength * (0.5^2) = 0.25
    const depth2 = createSymbol({
      char: 'F',
      parentParams: {},
      rng,
      config,
      depth: 2,
    })
    expect(depth2.params.length).toBe(0.25)
  })

  test('applies variability to length', () => {
    const config = createTestConfig({
      baseLength: 1.0,
      lengthFalloff: 1.0, // No falloff to isolate variability effect
      variability: 0.5,
    })

    // Collect multiple values to verify variability adds randomness
    const lengths: number[] = []
    for (let i = 0; i < 100; i++) {
      const rng = createRandom({ seed: `seed-${i}` })
      const result = createSymbol({
        char: 'F',
        parentParams: {},
        rng,
        config,
        depth: 0,
      })
      lengths.push(result.params.length!)
    }

    // With variability, we should see some variation in lengths
    const minLength = Math.min(...lengths)
    const maxLength = Math.max(...lengths)
    expect(maxLength - minLength).toBeGreaterThan(0.1)
  })

  test('creates angle symbol with angle parameter', () => {
    const config = createTestConfig({ branchAngle: 45, variability: 0 })

    // Test all rotation symbols
    const rotationChars = ['+', '-', '^', '&', '/', '\\']
    for (const char of rotationChars) {
      const result = createSymbol({
        char,
        parentParams: {},
        rng: createRandom({ seed: 'test' }),
        config,
        depth: 0,
      })

      expect(result.symbol).toBe(char)
      expect(result.params.angle).toBe(45)
    }
  })

  test('creates L symbol with size parameter', () => {
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig()

    const result = createSymbol({
      char: 'L',
      parentParams: {},
      rng,
      config,
      depth: 0,
    })

    expect(result.symbol).toBe('L')
    expect(result.params.size).toBe(1)
  })

  test('creates bracket symbols without special params', () => {
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig()

    const push = createSymbol({
      char: '[',
      parentParams: {},
      rng,
      config,
      depth: 0,
    })
    const pop = createSymbol({
      char: ']',
      parentParams: {},
      rng,
      config,
      depth: 0,
    })

    expect(push.symbol).toBe('[')
    expect(pop.symbol).toBe(']')
    expect(push.params).toEqual({})
    expect(pop.params).toEqual({})
  })
})

describe('parseProduction', () => {
  test('parses simple production string into symbols', () => {
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ variability: 0 })

    const result = parseProduction({
      production: 'FF',
      rng,
      config,
      depth: 0,
    })

    expect(result).toHaveLength(2)
    expect(result[0].symbol).toBe('F')
    expect(result[1].symbol).toBe('F')
  })

  test('parses production with multiple symbol types', () => {
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ variability: 0 })

    const result = parseProduction({
      production: 'F[+F]',
      rng,
      config,
      depth: 0,
    })

    expect(result).toHaveLength(5)
    expect(result.map((s) => s.symbol)).toEqual(['F', '[', '+', 'F', ']'])
  })
})

describe('applyRules', () => {
  test('replaces symbols according to rules', () => {
    const sentence: Symbol[] = [{ symbol: 'F', params: { length: 1 } }]
    const rules: Rule[] = [{ match: 'F', odds: 1.0, produce: 'FF' }]
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ variability: 0 })

    const result = applyRules({ sentence, rules, rng, config })

    expect(result).toHaveLength(2)
    expect(result[0].symbol).toBe('F')
    expect(result[1].symbol).toBe('F')
  })

  test('preserves symbols with no matching rules', () => {
    const sentence: Symbol[] = [
      { symbol: 'F', params: { length: 1 } },
      { symbol: '+', params: { angle: 30 } },
    ]
    const rules: Rule[] = [{ match: 'F', odds: 1.0, produce: 'FF' }]
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ variability: 0 })

    const result = applyRules({ sentence, rules, rng, config })

    // F becomes FF, + is preserved
    expect(result).toHaveLength(3)
    expect(result[0].symbol).toBe('F')
    expect(result[1].symbol).toBe('F')
    expect(result[2].symbol).toBe('+')
    expect(result[2].params.angle).toBe(30)
  })

  test('handles bracket symbols correctly', () => {
    const sentence: Symbol[] = [
      { symbol: 'F', params: {} },
      { symbol: '[', params: {} },
      { symbol: 'F', params: {} },
      { symbol: ']', params: {} },
    ]
    const rules: Rule[] = [{ match: 'F', odds: 1.0, produce: 'FF' }]
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ variability: 0, lengthFalloff: 0.5 })

    const result = applyRules({ sentence, rules, rng, config })

    // First F at depth 0 -> FF (both at depth 0)
    // [ preserved
    // F at depth 1 -> FF (both at depth 1, with falloff applied)
    // ] preserved
    expect(result).toHaveLength(6)
    expect(result.map((s) => s.symbol)).toEqual(['F', 'F', '[', 'F', 'F', ']'])

    // Check depth-based length falloff was applied
    // Symbols inside brackets (depth 1) should have shorter length
    const outerLength = result[0].params.length!
    const innerLength = result[3].params.length!
    expect(innerLength).toBeLessThan(outerLength)
  })

  test('tracks depth through nested brackets', () => {
    const sentence: Symbol[] = [
      { symbol: '[', params: {} },
      { symbol: '[', params: {} },
      { symbol: 'F', params: {} },
      { symbol: ']', params: {} },
      { symbol: ']', params: {} },
    ]
    const rules: Rule[] = [{ match: 'F', odds: 1.0, produce: 'F' }]
    const rng = createRandom({ seed: 'test' })
    const config = createTestConfig({ variability: 0, lengthFalloff: 0.5 })

    const result = applyRules({ sentence, rules, rng, config })

    // F is at depth 2 (inside two brackets)
    // Expected length: baseLength * (0.5^2) = 0.25
    const fSymbol = result.find((s) => s.symbol === 'F')!
    expect(fSymbol.params.length).toBe(0.25)
  })
})

describe('generateSentence', () => {
  test('applies rules for specified iterations', () => {
    const lsystem: LSystem = {
      axiom: 'F',
      rules: [{ match: 'F', odds: 1.0, produce: 'FF' }],
      config: createTestConfig({ variability: 0 }),
    }

    // 0 iterations: F (length 1)
    const iter0 = generateSentence({ lsystem, iterations: 0, seed: 'test' })
    expect(iter0).toHaveLength(1)

    // 1 iteration: FF (length 2)
    const iter1 = generateSentence({ lsystem, iterations: 1, seed: 'test' })
    expect(iter1).toHaveLength(2)

    // 2 iterations: FFFF (length 4)
    const iter2 = generateSentence({ lsystem, iterations: 2, seed: 'test' })
    expect(iter2).toHaveLength(4)

    // 3 iterations: FFFFFFFF (length 8)
    const iter3 = generateSentence({ lsystem, iterations: 3, seed: 'test' })
    expect(iter3).toHaveLength(8)
  })

  test('produces deterministic output for same seed', () => {
    const lsystem: LSystem = {
      axiom: 'F',
      rules: [
        { match: 'F', odds: 0.5, produce: 'F[+F]' },
        { match: 'F', odds: 0.5, produce: 'F[-F]' },
      ],
      config: createTestConfig({ variability: 0.5 }),
    }

    const result1 = generateSentence({
      lsystem,
      iterations: 3,
      seed: 'my-seed',
    })
    const result2 = generateSentence({
      lsystem,
      iterations: 3,
      seed: 'my-seed',
    })

    // Same seed should produce identical results
    expect(result1).toHaveLength(result2.length)
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].symbol).toBe(result2[i].symbol)
      expect(result1[i].params.length).toBe(result2[i].params.length)
      expect(result1[i].params.angle).toBe(result2[i].params.angle)
    }
  })

  test('produces different output for different seeds', () => {
    const lsystem: LSystem = {
      axiom: 'F',
      rules: [
        { match: 'F', odds: 0.5, produce: 'F[+F]' },
        { match: 'F', odds: 0.5, produce: 'F[-F]' },
      ],
      config: createTestConfig({ variability: 0.5 }),
    }

    const result1 = generateSentence({ lsystem, iterations: 3, seed: 'seed-1' })
    const result2 = generateSentence({ lsystem, iterations: 3, seed: 'seed-2' })

    // Different seeds should produce different results (with high probability)
    // Either different lengths or different symbols
    let different = result1.length !== result2.length
    if (!different) {
      for (let i = 0; i < result1.length; i++) {
        if (result1[i].symbol !== result2[i].symbol) {
          different = true
          break
        }
      }
    }
    expect(different).toBe(true)
  })
})
