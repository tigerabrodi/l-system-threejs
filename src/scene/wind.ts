import * as THREE from 'three'

/**
 * Wind configuration for controlling the animation behavior.
 * Adjust these values to create different wind intensities.
 */
export interface WindConfig {
  /** Wind strength (0-1 range, 0.3 is gentle breeze) */
  strength: number
  /** Wind direction in radians (0 = along +X axis) */
  direction: number
  /** Animation speed multiplier (1.0 = normal speed) */
  speed: number
}

/**
 * Wind uniforms for shader injection.
 * These are passed to the vertex shader for real-time animation.
 */
export interface WindUniforms {
  /** Elapsed time for animation (updated each frame) */
  uTime: { value: number }
  /** Wind strength uniform (matches config.strength) */
  uWindStrength: { value: number }
  /** Wind direction as 2D vector on XZ plane */
  uWindDirection: { value: THREE.Vector2 }
}

/**
 * Parameters for creating wind uniforms
 */
interface CreateWindUniformsParams {
  config: WindConfig
}

/**
 * Parameters for updating wind uniforms each frame
 */
interface UpdateWindUniformsParams {
  uniforms: WindUniforms
  deltaTime: number
}

/**
 * Parameters for applying wind animation to a material
 */
interface ApplyWindToMaterialParams {
  material: THREE.Material
  uniforms: WindUniforms
  /** Leaves move more than branches (default: false) */
  isLeaf?: boolean
}

/**
 * Create default wind configuration.
 * Returns a gentle breeze blowing along the +X axis.
 */
export function defaultWindConfig(): WindConfig {
  return {
    strength: 0.3,    // Gentle breeze
    direction: 0,      // Along +X axis
    speed: 1.0         // Normal animation speed
  }
}

/**
 * Create wind uniforms object from a wind configuration.
 * The uniforms are used by shaders to animate vertices.
 *
 * @param params - Object containing wind configuration
 * @returns WindUniforms object ready for shader injection
 */
export function createWindUniforms(params: CreateWindUniformsParams): WindUniforms {
  const { config } = params

  // Convert direction angle to 2D vector on XZ plane
  // direction = 0 means wind blows along +X
  const directionVector = new THREE.Vector2(
    Math.cos(config.direction),
    Math.sin(config.direction)
  )

  return {
    uTime: { value: 0 },
    uWindStrength: { value: config.strength },
    uWindDirection: { value: directionVector }
  }
}

/**
 * Update wind uniforms each frame.
 * Call this in your animation loop to advance the wind animation.
 *
 * @param params - Object containing uniforms and delta time
 */
export function updateWindUniforms(params: UpdateWindUniformsParams): void {
  const { uniforms, deltaTime } = params

  // Accumulate time for continuous animation
  // The shader uses this to create oscillating movement
  uniforms.uTime.value += deltaTime
}

/**
 * Apply wind animation to a material using onBeforeCompile.
 * This injects vertex shader code that displaces vertices based on height,
 * creating a swaying effect that simulates wind.
 *
 * @param params - Object containing material, uniforms, and leaf flag
 */
export function applyWindToMaterial(params: ApplyWindToMaterialParams): void {
  const { material, uniforms, isLeaf = false } = params

  // Leaves flutter more than branches
  const movementMultiplier = isLeaf ? 2.0 : 1.0

  // Store original onBeforeCompile if it exists
  const originalOnBeforeCompile = material.onBeforeCompile

  material.onBeforeCompile = (shader) => {
    // Call original onBeforeCompile if it existed
    if (originalOnBeforeCompile) {
      originalOnBeforeCompile(shader, {} as THREE.WebGLRenderer)
    }

    // Add wind uniforms to shader
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uWindStrength = uniforms.uWindStrength
    shader.uniforms.uWindDirection = uniforms.uWindDirection

    // Inject uniform declarations at the top of vertex shader
    // These must be declared before they're used in the main function
    const uniformDeclarations = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform vec2 uWindDirection;
    `

    // Inject uniforms after the #include directives at the top
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      ${uniformDeclarations}`
    )

    // Wind displacement code
    // - Effect increases with height (position.y)
    // - Sin wave creates oscillation over time
    // - Movement multiplier adjusts intensity for leaves vs branches
    const windDisplacementCode = `
      // Calculate wind effect based on vertex height
      // Higher vertices sway more than lower ones
      float windEffect = uWindStrength * transformed.y * 0.1 * ${movementMultiplier.toFixed(1)};

      // Create oscillating sway using sin wave
      // Adding position.y to time creates variation along the height
      float sway = sin(uTime * 2.0 + transformed.y * 0.5) * windEffect;

      // Calculate wind offset vector on XZ plane
      // Y component is 0 because wind moves things horizontally
      vec3 windOffset = vec3(
        uWindDirection.x * sway,
        0.0,
        uWindDirection.y * sway
      );

      // Apply wind displacement to vertex position
      transformed += windOffset;
    `

    // Inject wind displacement before the project_vertex include
    // This is where Three.js applies the final MVP transformation
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `${windDisplacementCode}
      #include <project_vertex>`
    )
  }

  // Mark material as needing update so onBeforeCompile gets called
  material.needsUpdate = true
}
