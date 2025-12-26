import * as THREE from 'three'

/**
 * Configuration for the ground plane
 */
export interface GroundConfig {
  /** Size of the ground plane (diameter for circle) */
  size: number
  /** Ground color (hex string) */
  color: string
  /** Whether to receive shadows from objects above */
  receiveShadow: boolean
}

/**
 * Returns the default ground configuration
 * - Warm earth tone color for natural appearance
 * - Size of 30 units provides good backdrop for trees
 * - Shadow receiving enabled for realistic lighting
 */
export function defaultGroundConfig(): GroundConfig {
  return {
    size: 30,
    color: '#C4B59D', // Warm beige/earth tone
    receiveShadow: true
  }
}

/**
 * Creates a ground plane mesh for the tree viewer
 * - Uses circular geometry for a natural, organic look
 * - Positioned horizontally at y=0 (rotated from default vertical orientation)
 * - Uses MeshStandardMaterial for physically-based rendering
 * - Low roughness gives subtle sheen without being distracting
 *
 * @param params - Object containing the ground configuration
 * @returns A Three.js Mesh representing the ground plane
 */
export function createGroundPlane(params: { config: GroundConfig }): THREE.Mesh {
  const { config } = params

  // Create circular geometry for organic appearance
  // 64 segments provides smooth edges without excessive geometry
  const geometry = new THREE.CircleGeometry(config.size / 2, 64)

  // Create material with subtle appearance
  // Low roughness (0.8) gives slight sheen for visual interest
  // Metalness at 0 keeps it looking like natural ground
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.color),
    roughness: 0.8,
    metalness: 0,
    side: THREE.DoubleSide // Visible from both sides if camera goes below
  })

  // Create the mesh
  const mesh = new THREE.Mesh(geometry, material)

  // Rotate to horizontal orientation
  // CircleGeometry is created in XY plane, rotate to XZ plane
  mesh.rotation.x = -Math.PI / 2

  // Position at ground level
  mesh.position.y = 0

  // Enable shadow receiving for realistic tree shadows
  mesh.receiveShadow = config.receiveShadow

  // Name for easy identification in scene hierarchy
  mesh.name = 'ground-plane'

  return mesh
}
