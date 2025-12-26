/**
 * L-System symbol constants and types.
 * These symbols control the turtle interpreter's behavior during tree generation.
 */

/** All valid L-system symbols */
export const SYMBOLS = {
  /** Draw a branch segment forward */
  FORWARD: 'F',
  /** Rotate around up axis (yaw left) */
  YAW_LEFT: '+',
  /** Rotate around up axis (yaw right) */
  YAW_RIGHT: '-',
  /** Tilt upward (pitch up) */
  PITCH_UP: '^',
  /** Tilt downward (pitch down) */
  PITCH_DOWN: '&',
  /** Roll counterclockwise */
  ROLL_LEFT: '\\',
  /** Roll clockwise */
  ROLL_RIGHT: '/',
  /** Push current state onto stack (start branch) */
  PUSH: '[',
  /** Pop state from stack (end branch) */
  POP: ']',
  /** Place a leaf at current position */
  LEAF: 'L',
  /** No-op placeholder for rule rewriting (draws nothing) */
  NOOP: 'X',
} as const

/** Union type of all symbol characters */
export type SymbolChar = (typeof SYMBOLS)[keyof typeof SYMBOLS]

/** Parameters that can be attached to a symbol */
export interface SymbolParams {
  /** Length of branch segment (for F) */
  length?: number
  /** Radius of branch at this point */
  radius?: number
  /** Rotation angle in degrees (for rotation symbols) */
  angle?: number
  /** Size of leaf (for L) */
  size?: number
  /** How many iterations deep this symbol was created */
  age?: number
}

/** A single symbol with its parameters */
export interface Symbol {
  /** The symbol character */
  symbol: string
  /** Parameters for this symbol instance */
  params: SymbolParams
}

/** A production rule for the L-system */
export interface Rule {
  /** Symbol to match */
  match: string
  /** Probability of this rule being selected (0-1) when multiple rules match */
  odds: number
  /** What to produce - either a string or a function for parameterized rules */
  produce: string | ProduceFunction
}

/** Function signature for parameterized production rules */
export type ProduceFunction = (params: {
  symbol: Symbol
  rng: RandomGenerator
  config: LSystemConfig
  depth: number
}) => Symbol[]

/** Random number generator interface (matches our random.ts output) */
export interface RandomGenerator {
  random: () => number
  randomRange: (params: { min: number; max: number }) => number
  randomInt: (params: { min: number; max: number }) => number
  randomChoice: <T>(params: { array: T[] }) => T
  randomChance: (params: { probability: number }) => boolean
}

/** Configuration for L-system generation */
export interface LSystemConfig {
  /** Base length of branch segments */
  baseLength: number
  /** Base radius of trunk */
  baseRadius: number
  /** Multiplier for length at each depth level */
  lengthFalloff: number
  /** Multiplier for radius at each depth level */
  radiusFalloff: number
  /** Default branch angle in degrees */
  branchAngle: number
  /** How much randomness to apply (0-1) */
  variability: number
}

/** Complete L-system definition */
export interface LSystem {
  /** Starting string/symbols */
  axiom: string
  /** Production rules */
  rules: Rule[]
  /** Generation configuration */
  config: LSystemConfig
}
