import * as THREE from 'three'
import barkTextureUrl from '../assets/bark-texture-pbr.png'

/**
 * Configuration for bark material
 */
export interface BarkMaterialConfig {
  /** Path to bark texture */
  texturePath: string
  /** Roughness of the bark surface (0-1) */
  roughness: number
  /** How much the texture repeats */
  textureRepeat: [number, number]
}

/**
 * Configuration for leaf material
 */
export interface LeafMaterialConfig {
  /** Base color of leaves */
  color: string
  /** Roughness (0-1) */
  roughness: number
  /** Metalness (0-1) */
  metalness: number
  /** Enable transparency for leaf edges */
  transparent: boolean
  /** Enable double-sided rendering */
  doubleSide: boolean
}

/**
 * Default bark material configuration
 * Returns sensible defaults for realistic bark appearance
 */
export function defaultBarkMaterialConfig(): BarkMaterialConfig {
  return {
    // Imported bark texture URL (Vite handles the asset bundling)
    texturePath: barkTextureUrl,
    // High roughness for realistic bark (0.9 = very rough, matte surface)
    roughness: 0.9,
    // Texture repeat values for UV mapping (horizontal, vertical)
    textureRepeat: [1, 1],
  }
}

/**
 * Default leaf material configuration
 * Returns sensible defaults for realistic foliage appearance
 */
export function defaultLeafMaterialConfig(): LeafMaterialConfig {
  return {
    // White base color - instance colors will provide the actual leaf color
    // (with vertexColors: true, final color = material.color × instance color)
    color: '#FFFFFF',
    // Moderate roughness for slightly glossy leaves
    roughness: 0.6,
    // No metalness for organic material
    metalness: 0.0,
    // Enable transparency for alpha-cut leaf edges
    transparent: true,
    // Double-sided so leaves are visible from any angle
    doubleSide: true,
  }
}

/**
 * Create bark material with texture
 * - Uses MeshStandardMaterial for physically-based rendering (PBR)
 * - Loads and applies bark texture with proper UV wrapping
 * - Sets appropriate roughness for realistic bark surface
 *
 * @param params - Object containing the bark material configuration
 * @returns A configured MeshStandardMaterial ready for use on tree branches
 */
export function createBarkMaterial(params: {
  config: BarkMaterialConfig
}): THREE.MeshStandardMaterial {
  const { config } = params

  // Create texture loader to load the bark texture image
  const textureLoader = new THREE.TextureLoader()

  // Load the bark texture from the specified path
  const barkTexture = textureLoader.load(config.texturePath)

  // Set texture wrapping to repeat for seamless tiling across geometry
  // RepeatWrapping allows the texture to tile infinitely in both directions
  barkTexture.wrapS = THREE.RepeatWrapping
  barkTexture.wrapT = THREE.RepeatWrapping

  // Apply texture repeat values from config
  // This controls how many times the texture tiles across the surface
  barkTexture.repeat.set(config.textureRepeat[0], config.textureRepeat[1])

  // Create the material with PBR properties for realistic rendering
  const material = new THREE.MeshStandardMaterial({
    // Apply the loaded bark texture as the base color map
    map: barkTexture,
    // High roughness creates a matte, natural bark appearance
    // Lower values would make bark look unnaturally shiny
    roughness: config.roughness,
    // No metalness for organic wood material
    metalness: 0.0,
  })

  return material
}

/**
 * Create leaf material
 * - Uses MeshStandardMaterial for PBR rendering
 * - Double-sided rendering for visibility from any angle
 * - Supports per-instance color variation via vertex colors
 * - Slightly translucent for realistic foliage look
 *
 * @param params - Object containing the leaf material configuration
 * @returns A configured MeshStandardMaterial ready for use on tree leaves
 */
export function createLeafMaterial(params: {
  config: LeafMaterialConfig
}): THREE.MeshStandardMaterial {
  const { config } = params

  // Create the material with properties suitable for foliage
  const material = new THREE.MeshStandardMaterial({
    // Base color for leaves (forest green by default)
    color: new THREE.Color(config.color),
    // Surface roughness - moderate for slightly glossy leaves
    roughness: config.roughness,
    // No metalness for organic leaf material
    metalness: config.metalness,
    // Enable transparency for alpha-cut edges on leaf geometry
    transparent: config.transparent,
    // Set render side based on config
    // DoubleSide ensures leaves are visible from front and back
    side: config.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    // Enable vertex colors for per-instance color variation
    // This allows individual leaves to have different colors/tints
    // when using instanced rendering or when colors are baked into vertices
    vertexColors: true,
  })

  return material
}
