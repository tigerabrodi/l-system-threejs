/**
 * Camera configuration for the tree viewer
 * Defines camera positioning, viewing frustum, and orbit controls settings
 */

/**
 * Camera configuration for the tree viewer
 */
export interface CameraConfig {
  /** Initial camera position [x, y, z] */
  position: [number, number, number];
  /** Point the camera looks at [x, y, z] */
  target: [number, number, number];
  /** Field of view in degrees */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
}

/**
 * OrbitControls configuration
 */
export interface OrbitControlsConfig {
  /** Enable damping for smooth movement */
  enableDamping: boolean;
  /** Damping factor - lower values create smoother but slower response */
  dampingFactor: number;
  /** Minimum zoom distance - prevents camera from getting too close */
  minDistance: number;
  /** Maximum zoom distance - prevents camera from zooming too far out */
  maxDistance: number;
  /** Minimum polar angle (radians) - prevents going below ground */
  minPolarAngle: number;
  /** Maximum polar angle (radians) - limits vertical rotation */
  maxPolarAngle: number;
}

/**
 * Get default camera configuration
 * - Position at (8, 6, 8) to view tree from a nice diagonal angle
 * - Looking at (0, 4, 0) - mid-height of a typical tree
 * - FOV of 50 degrees provides natural perspective without distortion
 * - Near/far planes of 0.1/500 cover typical scene dimensions
 *
 * @returns Default camera configuration for tree viewing
 */
export function defaultCameraConfig(): CameraConfig {
  return {
    // Position camera at a 45-degree angle to the tree for pleasing composition
    position: [8, 6, 8],
    // Target point slightly above ground to center on tree's visual mass
    target: [0, 4, 0],
    // 50 degree FOV provides natural perspective similar to human vision
    fov: 50,
    // Near plane at 0.1 prevents z-fighting while allowing close inspection
    near: 0.1,
    // Far plane at 500 ensures distant elements remain visible
    far: 500,
  };
}

/**
 * Get default orbit controls configuration
 * - Damping enabled for smooth, natural-feeling camera movement
 * - Distance constraints prevent extreme zoom levels
 * - Polar angle limits prevent camera from going underground
 *
 * @returns Default orbit controls configuration
 */
export function defaultOrbitControlsConfig(): OrbitControlsConfig {
  return {
    // Enable damping for smooth, momentum-based camera movement
    enableDamping: true,
    // Damping factor of 0.05 provides responsive but smooth feel
    dampingFactor: 0.05,
    // Minimum distance of 2 units prevents clipping into the tree
    minDistance: 2,
    // Maximum distance of 50 units keeps tree visible and usable
    maxDistance: 50,
    // Minimum polar angle of 0.1 radians (~5.7 degrees) prevents gimbal lock at top
    minPolarAngle: 0.1,
    // Maximum polar angle just under PI/2 (~85 degrees) prevents going underground
    maxPolarAngle: Math.PI / 2 - 0.05,
  };
}
