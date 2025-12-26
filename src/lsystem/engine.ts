/**
 * L-system engine module.
 * Provides functions for generating L-system sentences through iterative rule application.
 *
 * The engine supports:
 * - Stochastic rule selection with weighted probabilities
 * - Parameterized symbols with depth-based falloff
 * - Variability for organic-looking results
 * - Deterministic generation via seeded RNG
 */

import { createRandom } from './random'
import type {
  LSystem,
  LSystemConfig,
  ProduceFunction,
  RandomGenerator,
  Rule,
  Symbol,
} from './symbols'

/** Parameters for selectRule function */
export interface SelectRuleParams {
  /** Array of rules to select from */
  rules: Rule[]
  /** Random number generator for stochastic selection */
  rng: RandomGenerator
}

/** Parameters for createSymbol function */
export interface CreateSymbolParams {
  /** The character to create a symbol for */
  char: string
  /** Parameters inherited from parent symbol */
  parentParams: { length?: number; radius?: number }
  /** Random number generator for variability */
  rng: RandomGenerator
  /** L-system configuration */
  config: LSystemConfig
  /** Current depth in the tree (increases inside brackets) */
  depth: number
}

/** Parameters for parseProduction function */
export interface ParseProductionParams {
  /** The production string to parse */
  production: string
  /** Random number generator */
  rng: RandomGenerator
  /** L-system configuration */
  config: LSystemConfig
  /** Current depth in the tree */
  depth: number
}

/** Parameters for applyRules function */
export interface ApplyRulesParams {
  /** Current sentence to transform */
  sentence: Symbol[]
  /** Rules to apply */
  rules: Rule[]
  /** Random number generator */
  rng: RandomGenerator
  /** L-system configuration */
  config: LSystemConfig
}

/** Parameters for generateSentence function */
export interface GenerateSentenceParams {
  /** The L-system definition */
  lsystem: LSystem
  /** Number of iterations to apply */
  iterations: number
  /** Seed for deterministic random generation */
  seed: string
}

/**
 * Select a rule stochastically from an array of rules based on their odds.
 * If odds don't sum to 1, they are normalized automatically.
 *
 * @param params - Object containing rules and random generator
 * @returns The selected rule
 *
 * @example
 * ```typescript
 * const rules = [
 *   { match: 'F', odds: 0.7, produce: 'F[+F]' },
 *   { match: 'F', odds: 0.3, produce: 'F[-F]' },
 * ]
 * const selectedRule = selectRule({ rules, rng })
 * ```
 */
export function selectRule(params: SelectRuleParams): Rule {
  const { rules, rng } = params

  // Handle edge case of single rule
  if (rules.length === 1) {
    return rules[0]
  }

  // Calculate total odds for normalization
  const totalOdds = rules.reduce((sum, rule) => sum + rule.odds, 0)

  // Generate a random value between 0 and totalOdds
  const randomValue = rng.random() * totalOdds

  // Accumulate odds until we exceed the random value
  let accumulated = 0
  for (const rule of rules) {
    accumulated += rule.odds
    if (randomValue < accumulated) {
      return rule
    }
  }

  // Fallback to last rule (handles floating point edge cases)
  return rules[rules.length - 1]
}

/**
 * Create a symbol with appropriate parameters based on the character.
 * Applies variability and depth-based falloff for organic results.
 *
 * Symbol parameter calculations:
 * - F (forward): length = baseLength * (lengthFalloff ^ depth) * variability factor
 * - Rotation symbols (+, -, ^, &, /, \): angle = branchAngle * variability factor
 * - L (leaf): size = 1
 * - Brackets and others: no special params
 *
 * @param params - Object containing character, parent params, rng, config, and depth
 * @returns A Symbol object with calculated parameters
 */
export function createSymbol(params: CreateSymbolParams): Symbol {
  const { char, rng, config, depth } = params

  // Helper to calculate variability factor: (1 + variability * (random - 0.5) * 2)
  // This produces a range of [1 - variability, 1 + variability]
  const getVariabilityFactor = (): number => {
    if (config.variability === 0) return 1
    return 1 + config.variability * (rng.random() - 0.5) * 2
  }

  // Forward symbol - branch segment with length
  if (char === 'F') {
    const baseLengthWithFalloff =
      config.baseLength * Math.pow(config.lengthFalloff, depth)
    const length = baseLengthWithFalloff * getVariabilityFactor()
    return {
      symbol: char,
      params: { length },
    }
  }

  // Rotation symbols - apply angle with variability
  const rotationSymbols = ['+', '-', '^', '&', '/', '\\']
  if (rotationSymbols.includes(char)) {
    const angle = config.branchAngle * getVariabilityFactor()
    return {
      symbol: char,
      params: { angle },
    }
  }

  // Leaf symbol - fixed size
  if (char === 'L') {
    return {
      symbol: char,
      params: { size: 1 },
    }
  }

  // Bracket symbols and others - no special params
  return {
    symbol: char,
    params: {},
  }
}

/**
 * Parse a production string into an array of Symbol objects.
 * Each character becomes a symbol with calculated parameters.
 *
 * @param params - Object containing production string, rng, config, and depth
 * @returns Array of Symbol objects
 *
 * @example
 * ```typescript
 * const symbols = parseProduction({
 *   production: 'F[+F][-F]',
 *   rng,
 *   config,
 *   depth: 0
 * })
 * ```
 */
export function parseProduction(params: ParseProductionParams): Symbol[] {
  const { production, rng, config, depth } = params

  const symbols: Symbol[] = []

  for (const char of production) {
    const symbol = createSymbol({
      char,
      parentParams: {},
      rng,
      config,
      depth,
    })
    symbols.push(symbol)
  }

  return symbols
}

/**
 * Apply one iteration of rules to a sentence.
 * Tracks depth by counting bracket symbols for proper falloff application.
 *
 * For each symbol:
 * 1. Find all rules that match the symbol
 * 2. If rules exist, stochastically select one and expand
 * 3. If no rules match, keep the symbol unchanged
 *
 * @param params - Object containing sentence, rules, rng, and config
 * @returns New sentence with rules applied
 */
export function applyRules(params: ApplyRulesParams): Symbol[] {
  const { sentence, rules, rng, config } = params

  const result: Symbol[] = []
  let depth = 0

  for (const symbol of sentence) {
    // Track depth via bracket symbols
    if (symbol.symbol === '[') {
      result.push(symbol)
      depth++
      continue
    }

    if (symbol.symbol === ']') {
      result.push(symbol)
      depth--
      continue
    }

    // Find matching rules for this symbol
    const matchingRules = rules.filter((rule) => rule.match === symbol.symbol)

    if (matchingRules.length === 0) {
      // No matching rules - keep symbol unchanged
      result.push(symbol)
    } else {
      // Select a rule stochastically
      const selectedRule = selectRule({ rules: matchingRules, rng })

      // Apply the rule - handle both string and function productions
      if (typeof selectedRule.produce === 'string') {
        // Parse the production string into symbols
        const newSymbols = parseProduction({
          production: selectedRule.produce,
          rng,
          config,
          depth,
        })
        result.push(...newSymbols)
      } else {
        // Function production - call it with context
        const produceFunc = selectedRule.produce as ProduceFunction
        const newSymbols = produceFunc({
          symbol,
          rng,
          config,
          depth,
        })
        result.push(...newSymbols)
      }
    }
  }

  return result
}

/**
 * Generate a complete L-system sentence from axiom through N iterations.
 * Creates a fresh RNG from the seed for deterministic results.
 *
 * @param params - Object containing lsystem definition, iterations, and seed
 * @returns Final sentence after all iterations
 *
 * @example
 * ```typescript
 * const lsystem = {
 *   axiom: 'F',
 *   rules: [{ match: 'F', odds: 1.0, produce: 'F[+F][-F]' }],
 *   config: { ... }
 * }
 * const sentence = generateSentence({ lsystem, iterations: 3, seed: 'tree-123' })
 * ```
 */
export function generateSentence(params: GenerateSentenceParams): Symbol[] {
  const { lsystem, iterations, seed } = params

  // Create a fresh RNG from the seed for deterministic generation
  const rng = createRandom({ seed })

  // Parse the axiom into initial symbols
  let sentence = parseProduction({
    production: lsystem.axiom,
    rng,
    config: lsystem.config,
    depth: 0,
  })

  // Apply rules for the specified number of iterations
  for (let i = 0; i < iterations; i++) {
    sentence = applyRules({
      sentence,
      rules: lsystem.rules,
      rng,
      config: lsystem.config,
    })
  }

  return sentence
}
