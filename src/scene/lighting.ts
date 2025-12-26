import * as THREE from 'three'

/**
 * Configuration for the scene lighting
 */
export interface LightingConfig {
  /** Sun angle in degrees (0 = noon, 90 = sunset) */
  sunAngle: number
  /** Overall light intensity multiplier */
  intensity: number
}

/**
 * Default lighting configuration
 * Returns a preset configuration for late afternoon lighting
 */
export function defaultLightingConfig(): LightingConfig {
  return {
    // 45 degrees gives a nice late afternoon shadow angle
    sunAngle: 45,
    // Standard intensity, can be adjusted for different moods
    intensity: 1.0
  }
}

/**
 * Create the main directional light (sun)
 * - Warm color for late afternoon feel
 * - Casts shadows
 * - Position based on sunAngle
 *
 * The sun position is calculated using spherical coordinates:
 * - sunAngle of 0 = directly overhead (noon)
 * - sunAngle of 90 = on the horizon (sunset)
 */
export function createSunLight(params: { config: LightingConfig }): THREE.DirectionalLight {
  const { config } = params

  // Warm white color (#FFFAF0 - Floral White) for natural sunlight
  const sunColor = new THREE.Color(0xfffaf0)

  // Create the directional light with configured intensity
  const sunLight = new THREE.DirectionalLight(sunColor, config.intensity)

  // Calculate sun position from angle using spherical coordinates
  // Convert degrees to radians for Three.js math
  const angleInRadians = THREE.MathUtils.degToRad(config.sunAngle)

  // Distance from origin - far enough to illuminate the entire scene
  const sunDistance = 20

  // Calculate position:
  // - At angle 0 (noon): sun is directly above (y = sunDistance)
  // - At angle 90 (sunset): sun is on horizon (z = sunDistance)
  // We rotate around the X axis, so the sun moves in the Y-Z plane
  const sunY = Math.cos(angleInRadians) * sunDistance
  const sunZ = Math.sin(angleInRadians) * sunDistance

  // Offset slightly in X for more interesting shadows
  sunLight.position.set(5, sunY, sunZ)

  // Point the light at the origin where the tree will be
  sunLight.target.position.set(0, 0, 0)

  // Enable shadow casting for realistic tree shadows
  sunLight.castShadow = true

  // Configure shadow map for good quality
  // 2048x2048 provides a good balance of quality and performance
  sunLight.shadow.mapSize.width = 2048
  sunLight.shadow.mapSize.height = 2048

  // Configure the shadow camera bounds
  // These define the area where shadows will be rendered
  const shadowCameraSize = 15
  sunLight.shadow.camera.left = -shadowCameraSize
  sunLight.shadow.camera.right = shadowCameraSize
  sunLight.shadow.camera.top = shadowCameraSize
  sunLight.shadow.camera.bottom = -shadowCameraSize

  // Near and far planes for shadow camera
  // Adjusted to encompass typical tree heights
  sunLight.shadow.camera.near = 0.5
  sunLight.shadow.camera.far = 50

  // Slight shadow bias to prevent shadow acne artifacts
  sunLight.shadow.bias = -0.0005

  return sunLight
}

/**
 * Create ambient/hemisphere lighting for fill
 * - Sky color (light blue) from above
 * - Ground color (warm brown) from below
 *
 * Hemisphere lights simulate the natural ambient light
 * where the sky provides cool light from above and
 * the ground reflects warm light from below
 */
export function createAmbientLighting(params: { config: LightingConfig }): THREE.HemisphereLight {
  const { config } = params

  // Sky color: Light sky blue (#87CEEB)
  // Provides cool fill light from above
  const skyColor = new THREE.Color(0x87ceeb)

  // Ground color: Warm brown (#8B7355)
  // Simulates light reflected from earth/ground
  const groundColor = new THREE.Color(0x8b7355)

  // Hemisphere light intensity is typically lower than the main sun
  // to act as fill lighting without overpowering the directional light
  const ambientIntensity = config.intensity * 0.4

  // Create the hemisphere light
  const hemisphereLight = new THREE.HemisphereLight(
    skyColor,
    groundColor,
    ambientIntensity
  )

  // Position above the scene (though position mainly affects
  // the direction of the gradient, not the light origin)
  hemisphereLight.position.set(0, 10, 0)

  return hemisphereLight
}
