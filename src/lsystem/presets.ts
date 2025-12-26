/**
 * Tree presets for L-system generation.
 * Each preset defines a unique tree type with its own growth patterns and characteristics.
 */

import type { LSystem, LSystemConfig } from './symbols'

/**
 * Named preset with display information for UI integration
 */
export interface TreePreset {
  /** Display name for UI */
  name: string
  /** Short description of the tree type */
  description: string
  /** The L-system definition */
  lsystem: LSystem
  /** Suggested iteration count for optimal results */
  iterations: number
}

// =============================================================================
// Default Configuration Values
// =============================================================================

/**
 * Base configuration shared by most tree presets.
 * Individual presets override specific values as needed.
 */
const DEFAULT_CONFIG: LSystemConfig = {
  baseLength: 1.0,
  baseRadius: 0.1,
  lengthFalloff: 0.85,
  radiusFalloff: 0.7,
  branchAngle: 25,
  variability: 0.1,
}

// =============================================================================
// Tree Preset Definitions
// =============================================================================

/**
 * Oak tree preset - broad, spreading branches characteristic of deciduous oaks.
 * Features wide branching angles and multiple growth directions.
 */
const oakPreset: TreePreset = {
  name: 'Oak',
  description: 'Broad, spreading branches like a deciduous oak',
  iterations: 5,
  lsystem: {
    axiom: 'FX',
    rules: [
      // Main expansion rule - creates wide, spreading structure
      {
        match: 'X',
        odds: 0.5,
        produce: 'F[+FX][-FX][^FX][&FX]L',
      },
      // Alternate expansion with more horizontal spread
      {
        match: 'X',
        odds: 0.3,
        produce: 'F[++FX][--FX]FX',
      },
      // Simple growth for variety
      {
        match: 'X',
        odds: 0.2,
        produce: 'F[+FX]F[-FX]L',
      },
      // Branch segments grow and may split
      {
        match: 'F',
        odds: 0.7,
        produce: 'FF',
      },
      // Some branches stay short
      {
        match: 'F',
        odds: 0.3,
        produce: 'F',
      },
    ],
    config: {
      ...DEFAULT_CONFIG,
      branchAngle: 32,
      variability: 0.15,
      lengthFalloff: 0.8,
    },
  },
}

/**
 * Pine tree preset - tall conifer with strong vertical growth.
 * Features upward-pointing branches and a dominant central trunk.
 */
const pinePreset: TreePreset = {
  name: 'Pine',
  description: 'Tall conifer with upward-pointing branches',
  iterations: 6,
  lsystem: {
    axiom: 'FX',
    rules: [
      // Main growth - strong vertical trunk with side branches pointing up
      {
        match: 'X',
        odds: 0.6,
        produce: 'F[+^FX][-^FX]FX',
      },
      // Whorl pattern - branches around trunk
      {
        match: 'X',
        odds: 0.25,
        produce: 'F[+^FL][-^FL][/+^FL][/-^FL]FX',
      },
      // Simple vertical extension
      {
        match: 'X',
        odds: 0.15,
        produce: 'FFX',
      },
      // Trunk growth - mostly continuous
      {
        match: 'F',
        odds: 0.8,
        produce: 'FF',
      },
      {
        match: 'F',
        odds: 0.2,
        produce: 'F',
      },
    ],
    config: {
      ...DEFAULT_CONFIG,
      branchAngle: 22,
      variability: 0.1,
      lengthFalloff: 0.88,
      radiusFalloff: 0.75,
    },
  },
}

/**
 * Willow tree preset - graceful drooping branches.
 * Features downward-curving growth patterns and long cascading branches.
 */
const willowPreset: TreePreset = {
  name: 'Willow',
  description: 'Graceful drooping branches that cascade downward',
  iterations: 5,
  lsystem: {
    axiom: 'FX',
    rules: [
      // Main drooping pattern - branches pitch downward
      {
        match: 'X',
        odds: 0.4,
        produce: 'F[+&FX][-&FX][&FX]L',
      },
      // Long cascading branches
      {
        match: 'X',
        odds: 0.35,
        produce: 'F&F[+&FL][-&FL]&FX',
      },
      // Upward initial growth before drooping
      {
        match: 'X',
        odds: 0.25,
        produce: 'F^F[+&&FX][-&&FX]',
      },
      // Branches continue drooping as they grow
      {
        match: 'F',
        odds: 0.6,
        produce: 'F&F',
      },
      {
        match: 'F',
        odds: 0.4,
        produce: 'FF',
      },
    ],
    config: {
      ...DEFAULT_CONFIG,
      branchAngle: 45,
      variability: 0.2,
      lengthFalloff: 0.82,
      radiusFalloff: 0.65,
    },
  },
}

/**
 * Bush preset - dense, low-growing shrub.
 * Features lots of branching with shorter segments and high variability.
 */
const bushPreset: TreePreset = {
  name: 'Bush',
  description: 'Dense, low-growing shrub with many branches',
  iterations: 4,
  lsystem: {
    axiom: 'FX',
    rules: [
      // Heavy branching in multiple directions
      {
        match: 'X',
        odds: 0.4,
        produce: '[+FX][-FX][^FX][&FX]L',
      },
      // Dense cluster pattern
      {
        match: 'X',
        odds: 0.3,
        produce: 'F[++FX][--FX][+FX][-FX]L',
      },
      // Spreading low growth
      {
        match: 'X',
        odds: 0.3,
        produce: '[+&FX][-&FX]F[+FX][-FX]',
      },
      // Short segment growth
      {
        match: 'F',
        odds: 0.5,
        produce: 'F',
      },
      // Occasional longer segments
      {
        match: 'F',
        odds: 0.3,
        produce: 'FF',
      },
      // Very short for density
      {
        match: 'F',
        odds: 0.2,
        produce: '',
      },
    ],
    config: {
      ...DEFAULT_CONFIG,
      baseLength: 0.6,
      branchAngle: 35,
      variability: 0.25,
      lengthFalloff: 0.7,
      radiusFalloff: 0.6,
    },
  },
}

/**
 * Simple tree preset - basic test tree for debugging and learning.
 * Uses the classic L-system branching pattern.
 */
const simplePreset: TreePreset = {
  name: 'Simple',
  description: 'Basic test tree for debugging and learning',
  iterations: 3,
  lsystem: {
    axiom: 'F',
    rules: [
      // Classic L-system branching pattern
      {
        match: 'F',
        odds: 1.0,
        produce: 'F[+F]F[-F]F',
      },
    ],
    config: {
      ...DEFAULT_CONFIG,
      branchAngle: 25.7,
      variability: 0.0,
      lengthFalloff: 0.9,
    },
  },
}

// =============================================================================
// Preset Registry
// =============================================================================

/**
 * Internal registry of all available presets.
 * Add new presets here to make them available through the API.
 */
const PRESET_REGISTRY: TreePreset[] = [
  oakPreset,
  pinePreset,
  willowPreset,
  bushPreset,
  simplePreset,
]

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Get all available tree presets.
 * Returns a new array to prevent external modification of the registry.
 *
 * @returns Array of all tree presets
 *
 * @example
 * const presets = getAllPresets()
 * presets.forEach(preset => console.log(preset.name))
 */
export function getAllPresets(): TreePreset[] {
  // Return a shallow copy to prevent external modification
  return [...PRESET_REGISTRY]
}

/**
 * Get a specific preset by its name.
 * Name matching is case-insensitive for convenience.
 *
 * @param params - Object containing the preset name to find
 * @param params.name - The name of the preset to retrieve
 * @returns The matching preset, or undefined if not found
 *
 * @example
 * const oak = getPreset({ name: 'Oak' })
 * if (oak) {
 *   console.log(oak.description) // "Broad, spreading branches..."
 * }
 *
 * @example
 * // Case-insensitive matching
 * const pine = getPreset({ name: 'pine' }) // Works!
 */
export function getPreset(params: { name: string }): TreePreset | undefined {
  const { name } = params
  const lowerName = name.toLowerCase()

  return PRESET_REGISTRY.find(
    (preset) => preset.name.toLowerCase() === lowerName
  )
}
