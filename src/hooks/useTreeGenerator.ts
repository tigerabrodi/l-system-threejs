import { useState, useCallback, useMemo } from 'react'
import type { TreeConfig, TreeResult, TreeStats } from '../tree/TreeBuilder'
import { buildTree, defaultTreeConfig } from '../tree/TreeBuilder'
import { getAllPresets, getPreset } from '../lsystem/presets'

/**
 * Parameters exposed to UI for tree customization.
 * These are user-friendly parameters that get converted to the full TreeConfig internally.
 */
export interface TreeParams {
  /** Selected preset name */
  preset: string
  /** Random seed for deterministic generation */
  seed: string
  /** Number of L-system iterations (affects complexity) */
  iterations: number
  /** Branch angle in degrees */
  branchAngle: number
  /** Length falloff multiplier per depth level (0-1, smaller = shorter branches) */
  lengthFalloff: number
  /** Radius falloff multiplier per depth level (0-1, smaller = thinner branches) */
  radiusFalloff: number
  /** Randomness/variability factor (0-1, higher = more varied) */
  variability: number
  /** Base branch length in world units */
  baseLength: number
  /** Base trunk radius in world units */
  baseRadius: number
  /** Leaf size multiplier */
  leafSize: number
  /** Leaf density (0-1, affects probability of leaf placement) */
  leafDensity: number
  /** Leaf color as hex string (e.g., "#228B22") */
  leafColor: string
}

/**
 * Parameters for setting a single tree parameter.
 */
export interface SetParamParams<K extends keyof TreeParams> {
  /** The parameter key to update */
  key: K
  /** The new value for the parameter */
  value: TreeParams[K]
}

/**
 * Parameters for setting multiple tree parameters at once.
 */
export interface SetParamsParams {
  /** Partial object of parameters to update */
  updates: Partial<TreeParams>
}

/**
 * Return type of the useTreeGenerator hook.
 * Provides access to tree state, parameters, and control functions.
 */
export interface UseTreeGeneratorReturn {
  /** Current tree result (null if not yet generated) */
  tree: TreeResult | null
  /** Current tree statistics (null if no tree generated) */
  stats: TreeStats | null
  /** Current parameters */
  params: TreeParams
  /** Update a single parameter by key */
  setParam: <K extends keyof TreeParams>(params: SetParamParams<K>) => void
  /** Update multiple parameters at once */
  setParams: (params: SetParamsParams) => void
  /** Regenerate tree with current parameters */
  regenerate: () => void
  /** Randomize the seed value */
  randomizeSeed: () => void
  /** List of available preset names */
  presetNames: string[]
  /** Whether the tree is currently being generated */
  isGenerating: boolean
}

/**
 * Generate a random seed string.
 * Creates a short alphanumeric string suitable for seed values.
 *
 * @returns A random 6-character alphanumeric string
 */
function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 8)
}

/**
 * Convert a hex color string to RGB components (0-1 range).
 *
 * @param hex - Hex color string (e.g., "#228B22" or "228B22")
 * @returns Object with r, g, b values in 0-1 range
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove leading # if present
  const cleanHex = hex.replace(/^#/, '')

  // Parse hex values
  const bigint = parseInt(cleanHex, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255

  return { r, g, b }
}

/**
 * Create default tree parameters.
 * Returns sensible defaults that work well as a starting point.
 *
 * @returns Default TreeParams object
 *
 * @example
 * ```typescript
 * const params = defaultTreeParams()
 * console.log(params.preset) // "Oak"
 * ```
 */
export function defaultTreeParams(): TreeParams {
  return {
    preset: 'Oak',
    seed: generateRandomSeed(),
    iterations: 5,
    branchAngle: 32,
    lengthFalloff: 0.8,
    radiusFalloff: 0.7,
    variability: 0.15,
    baseLength: 1.0,
    baseRadius: 0.1,
    leafSize: 1.0,
    leafDensity: 1.0,
    leafColor: '#228B22', // Forest green
  }
}

/**
 * Convert UI-friendly TreeParams to the full TreeConfig needed by buildTree.
 *
 * @param params - User-facing tree parameters
 * @returns Complete TreeConfig for the build pipeline
 */
function paramsToConfig(params: TreeParams): TreeConfig {
  // Start with default config as base
  const baseConfig = defaultTreeConfig()

  // Try to get the selected preset's L-system
  const preset = getPreset({ name: params.preset })
  const lsystem = preset?.lsystem ?? baseConfig.lsystem

  // Override the L-system's config values with user parameters
  const updatedLSystem = {
    ...lsystem,
    config: {
      ...lsystem.config,
      baseLength: params.baseLength,
      baseRadius: params.baseRadius,
      lengthFalloff: params.lengthFalloff,
      radiusFalloff: params.radiusFalloff,
      branchAngle: params.branchAngle,
      variability: params.variability,
    },
  }

  // Parse the leaf color from hex to RGB
  const leafColorRgb = hexToRgb(params.leafColor)

  // Build the complete config
  const config: TreeConfig = {
    lsystem: updatedLSystem,
    iterations: params.iterations,
    seed: params.seed,
    turtleConfig: {
      ...baseConfig.turtleConfig,
      baseRadius: params.baseRadius,
      radiusFalloff: params.radiusFalloff,
    },
    branchConfig: baseConfig.branchConfig,
    leafShapeConfig: {
      ...baseConfig.leafShapeConfig,
      // Scale leaf dimensions by leafSize
      width: baseConfig.leafShapeConfig.width * params.leafSize,
      length: baseConfig.leafShapeConfig.length * params.leafSize,
    },
    leafInstanceConfig: {
      ...baseConfig.leafInstanceConfig,
      baseColor: leafColorRgb,
      // Use seed for deterministic leaf variation
      seed: params.seed + '-leaves',
    },
  }

  return config
}

/**
 * Hook to manage tree generation state and parameters.
 *
 * Provides a complete interface for:
 * - Managing tree generation parameters
 * - Switching between presets while preserving user customizations
 * - Regenerating trees on demand
 * - Tracking generation state
 *
 * @returns Object containing tree state, parameters, and control functions
 *
 * @example
 * ```typescript
 * function TreeEditor() {
 *   const {
 *     tree,
 *     stats,
 *     params,
 *     setParam,
 *     regenerate,
 *     presetNames
 *   } = useTreeGenerator()
 *
 *   return (
 *     <div>
 *       <select
 *         value={params.preset}
 *         onChange={(e) => setParam({ key: 'preset', value: e.target.value })}
 *       >
 *         {presetNames.map(name => (
 *           <option key={name} value={name}>{name}</option>
 *         ))}
 *       </select>
 *       <button onClick={regenerate}>Regenerate</button>
 *       {stats && <p>Triangles: {stats.triangleCount}</p>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTreeGenerator(): UseTreeGeneratorReturn {
  // Tree parameters state
  const [params, setParamsState] = useState<TreeParams>(defaultTreeParams)

  // Generated tree result
  const [tree, setTree] = useState<TreeResult | null>(null)

  // Generation state flag
  const [isGenerating, setIsGenerating] = useState(false)

  // Get available preset names (memoized to avoid recreating on every render)
  const presetNames = useMemo(() => {
    return getAllPresets().map((preset) => preset.name)
  }, [])

  /**
   * Update a single parameter by key.
   * When the preset changes, load that preset's suggested iterations
   * but keep other user customizations.
   */
  const setParam = useCallback(
    <K extends keyof TreeParams>(setParamParams: SetParamParams<K>) => {
      const { key, value } = setParamParams

      setParamsState((prev) => {
        const updated = { ...prev, [key]: value }

        // When preset changes, load the preset's suggested iteration count
        // This gives users a good starting point for each tree type
        if (key === 'preset') {
          const preset = getPreset({ name: value as string })
          if (preset) {
            updated.iterations = preset.iterations
            // Also apply the preset's default branch angle and other config
            if (preset.lsystem.config) {
              updated.branchAngle = preset.lsystem.config.branchAngle
              updated.lengthFalloff = preset.lsystem.config.lengthFalloff
              updated.radiusFalloff = preset.lsystem.config.radiusFalloff
              updated.variability = preset.lsystem.config.variability
              if (preset.lsystem.config.baseLength !== undefined) {
                updated.baseLength = preset.lsystem.config.baseLength
              }
            }
          }
        }

        return updated
      })
    },
    []
  )

  /**
   * Update multiple parameters at once.
   * Useful for bulk updates or loading saved configurations.
   */
  const setParams = useCallback((setParamsParams: SetParamsParams) => {
    const { updates } = setParamsParams
    setParamsState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Regenerate the tree with current parameters.
   * Sets isGenerating flag during generation.
   */
  const regenerate = useCallback(() => {
    setIsGenerating(true)

    try {
      // Convert UI params to full tree config
      const config = paramsToConfig(params)

      // Build the tree
      const result = buildTree({ config })

      setTree(result)
    } catch (error) {
      // Log error but don't crash the UI
      console.error('Tree generation failed:', error)
      setTree(null)
    } finally {
      setIsGenerating(false)
    }
  }, [params])

  /**
   * Randomize the seed value.
   * Useful for quickly generating variations of the same tree type.
   */
  const randomizeSeed = useCallback(() => {
    const newSeed = generateRandomSeed()
    setParamsState((prev) => ({ ...prev, seed: newSeed }))
  }, [])

  // Extract stats from tree result (null if no tree)
  const stats = tree?.stats ?? null

  return {
    tree,
    stats,
    params,
    setParam,
    setParams,
    regenerate,
    randomizeSeed,
    presetNames,
    isGenerating,
  }
}
