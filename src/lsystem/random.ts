/**
 * Seeded random number generator module.
 * Uses xmur3 for seed hashing and sfc32 for the PRNG.
 *
 * This provides deterministic random number generation which is essential
 * for reproducible L-system tree generation - the same seed always produces
 * the same tree structure.
 */

import type { RandomGenerator } from './symbols'

/**
 * xmur3 hash function - converts a string seed into a sequence of 32-bit integers.
 * This is used to initialize the sfc32 PRNG with good quality starting values.
 *
 * @param str - The string to hash
 * @returns A function that produces sequential hash values
 */
function xmur3(str: string): () => number {
  // Initialize hash with a prime XORed with string length
  let h = 1779033703 ^ str.length

  // Process each character of the string
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  // Return a function that generates sequential hash values
  return function (): number {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

/**
 * sfc32 (Simple Fast Counter) PRNG.
 * A fast, high-quality 32-bit random number generator.
 * Has a period of approximately 2^128 and passes PractRand tests.
 *
 * @param a - First state value
 * @param b - Second state value
 * @param c - Third state value
 * @param d - Counter value
 * @returns A function that produces random numbers between 0 and 1
 */
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function (): number {
    // Ensure all values are treated as unsigned 32-bit integers
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0

    // Main PRNG calculation
    let t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    t = (t + d) | 0
    c = (c + t) | 0

    // Convert to 0-1 range by dividing by 2^32
    return (t >>> 0) / 4294967296
  }
}

/** Parameters for creating a random generator */
export interface CreateRandomParams {
  /** String seed for reproducible random sequences */
  seed: string
}

/** Parameters for randomRange function */
export interface RandomRangeParams {
  /** Minimum value (inclusive) */
  min: number
  /** Maximum value (exclusive) */
  max: number
}

/** Parameters for randomInt function */
export interface RandomIntParams {
  /** Minimum value (inclusive) */
  min: number
  /** Maximum value (inclusive) */
  max: number
}

/** Parameters for randomChoice function */
export interface RandomChoiceParams<T> {
  /** Array to choose from */
  array: T[]
}

/** Parameters for randomChance function */
export interface RandomChanceParams {
  /** Probability of returning true (0 to 1) */
  probability: number
}

/**
 * Creates a seeded random number generator.
 * The same seed will always produce the same sequence of random numbers,
 * which is essential for reproducible procedural generation.
 *
 * @param params - Object containing the seed string
 * @returns A RandomGenerator instance with various random utility methods
 *
 * @example
 * ```typescript
 * const rng = createRandom({ seed: 'my-tree-123' })
 * const value = rng.random() // Always same value for same seed
 * const angle = rng.randomRange({ min: -30, max: 30 })
 * ```
 */
export function createRandom(params: CreateRandomParams): RandomGenerator {
  // Use xmur3 to hash the seed string into initial state values
  const seedHash = xmur3(params.seed)

  // Initialize sfc32 with four hash values derived from the seed
  const nextRandom = sfc32(seedHash(), seedHash(), seedHash(), seedHash())

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive).
   */
  function random(): number {
    return nextRandom()
  }

  /**
   * Returns a random number within the specified range.
   *
   * @param params - Object with min and max bounds
   * @returns A number >= min and < max
   */
  function randomRange(params: RandomRangeParams): number {
    const { min, max } = params
    return min + nextRandom() * (max - min)
  }

  /**
   * Returns a random integer within the specified range (inclusive on both ends).
   *
   * @param params - Object with min and max bounds
   * @returns An integer >= min and <= max
   */
  function randomInt(params: RandomIntParams): number {
    const { min, max } = params
    // Add 1 to max to make it inclusive, then floor to get integer
    return Math.floor(min + nextRandom() * (max - min + 1))
  }

  /**
   * Returns a random element from the given array.
   *
   * @param params - Object containing the array to choose from
   * @returns A random element from the array
   */
  function randomChoice<T>(params: RandomChoiceParams<T>): T {
    const { array } = params
    const index = Math.floor(nextRandom() * array.length)
    return array[index]
  }

  /**
   * Returns true with the given probability.
   *
   * @param params - Object containing the probability (0 to 1)
   * @returns true if random value is less than probability
   */
  function randomChance(params: RandomChanceParams): boolean {
    return nextRandom() < params.probability
  }

  // Return the RandomGenerator interface
  return {
    random,
    randomRange,
    randomInt,
    randomChoice,
    randomChance,
  }
}
