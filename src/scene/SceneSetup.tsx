/**
 * Scene Setup Component
 *
 * Main Three.js scene setup using React Three Fiber.
 * This component creates the complete 3D environment for displaying L-system trees,
 * including:
 * - Canvas with proper WebGL configuration
 * - Camera and orbit controls for navigation
 * - Lighting (sun directional light + hemisphere ambient)
 * - Ground plane for visual grounding
 * - Wind animation system for natural tree movement
 * - Tree rendering with wireframe toggle support
 */

import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { TreeResult } from '../tree/TreeBuilder'
import { defaultCameraConfig, defaultOrbitControlsConfig } from './camera'
import { createGroundPlane, defaultGroundConfig } from './ground'
import {
  createAmbientLighting,
  createSunLight,
  defaultLightingConfig,
} from './lighting'
import {
  applyWindToMaterial,
  createWindUniforms,
  defaultWindConfig,
  updateWindUniforms,
} from './wind'
import type { WindUniforms } from './wind'

/**
 * Props for the tree scene components
 */
interface TreeSceneProps {
  /** Generated tree result from TreeBuilder (null if no tree generated yet) */
  tree: TreeResult | null
  /** Wind strength (0-1), controls intensity of wind animation */
  windStrength: number
  /** Whether to show wireframe rendering for debugging/visualization */
  wireframe: boolean
}

/**
 * Inner scene content component - lights, ground, tree.
 * Must be used inside a Canvas component as it accesses the Three.js context.
 *
 * This component handles:
 * - Creating and managing scene lights (sun + ambient)
 * - Creating the ground plane
 * - Adding/removing tree meshes when the tree prop changes
 * - Updating wind animation uniforms each frame
 * - Toggling wireframe mode on tree materials
 */
function SceneContent(props: TreeSceneProps) {
  const { tree, windStrength, wireframe } = props

  // Access the Three.js scene from React Three Fiber context
  const { scene } = useThree()

  // Refs for scene objects that need to be added/managed imperatively
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null)
  const ambientLightRef = useRef<THREE.HemisphereLight | null>(null)
  const groundRef = useRef<THREE.Mesh | null>(null)
  const currentTreeRef = useRef<THREE.Group | null>(null)

  // Wind uniforms stored in ref - mutable Three.js objects that persist across renders
  // Using useRef (not useMemo) because these uniforms are intentionally mutated each frame
  // The ref is initialized once on first render with the default wind config
  const windUniformsRef = useRef<WindUniforms>(
    createWindUniforms({ config: defaultWindConfig() })
  )

  // Initialize lights and ground on mount
  useEffect(() => {
    const lightingConfig = defaultLightingConfig()
    const groundConfig = defaultGroundConfig()

    // Create sun light (directional light with shadows)
    const sunLight = createSunLight({ config: lightingConfig })
    sunLightRef.current = sunLight
    scene.add(sunLight)
    // Also add the light's target to the scene (required for directional lights)
    scene.add(sunLight.target)

    // Create ambient lighting (hemisphere light for natural fill)
    const ambientLight = createAmbientLighting({ config: lightingConfig })
    ambientLightRef.current = ambientLight
    scene.add(ambientLight)

    // Create ground plane
    const ground = createGroundPlane({ config: groundConfig })
    groundRef.current = ground
    scene.add(ground)

    // Cleanup function - remove objects when component unmounts
    return () => {
      if (sunLightRef.current) {
        scene.remove(sunLightRef.current)
        scene.remove(sunLightRef.current.target)
      }
      if (ambientLightRef.current) {
        scene.remove(ambientLightRef.current)
      }
      if (groundRef.current) {
        scene.remove(groundRef.current)
      }
    }
  }, [scene])

  // Handle tree changes - add new tree, remove old one
  useEffect(() => {
    // Remove old tree if it exists
    if (currentTreeRef.current) {
      scene.remove(currentTreeRef.current)
      currentTreeRef.current = null
    }

    // Add new tree if provided
    if (tree) {
      // Clone the group to avoid modifying the original
      const treeGroup = tree.group

      // Apply wind animation to branch material
      if (tree.branchMesh && tree.branchMesh.material) {
        const branchMaterial = tree.branchMesh.material as THREE.Material
        applyWindToMaterial({
          material: branchMaterial,
          uniforms: windUniformsRef.current,
          isLeaf: false,
        })
      }

      // Apply wind animation to leaf material (with higher movement multiplier)
      if (tree.leafMesh && tree.leafMesh.material) {
        const leafMaterial = tree.leafMesh.material as THREE.Material
        applyWindToMaterial({
          material: leafMaterial,
          uniforms: windUniformsRef.current,
          isLeaf: true,
        })
      }

      // Add tree group to scene
      // Note: Shadow casting is configured in TreeBuilder when meshes are created
      scene.add(treeGroup)
      currentTreeRef.current = treeGroup
    }

    // Cleanup function - remove tree when component unmounts or tree changes
    return () => {
      if (currentTreeRef.current) {
        scene.remove(currentTreeRef.current)
        currentTreeRef.current = null
      }
    }
  }, [tree, scene])

  // Handle wireframe toggle - traverse tree meshes and update material.wireframe
  useEffect(() => {
    if (currentTreeRef.current) {
      // Traverse all children of the tree group
      currentTreeRef.current.traverse((child) => {
        // Check if this child is a mesh with a material
        if (
          child instanceof THREE.Mesh ||
          child instanceof THREE.InstancedMesh
        ) {
          const material = child.material as THREE.Material
          // MeshStandardMaterial and other materials have a wireframe property
          if ('wireframe' in material) {
            ;(material as THREE.MeshStandardMaterial).wireframe = wireframe
          }
        }
      })
    }
  }, [wireframe])

  // Animation loop - update wind uniforms each frame
  useFrame((_state, delta) => {
    // Update wind strength from prop (read fresh each frame)
    windUniformsRef.current.uWindStrength.value = windStrength

    // Update wind animation time
    updateWindUniforms({
      uniforms: windUniformsRef.current,
      deltaTime: delta,
    })
  })

  // This component doesn't render any JSX elements itself
  // All Three.js objects are added imperatively to the scene
  return <></>
}

/**
 * Main scene setup component with Canvas.
 *
 * This is the primary export that wraps everything in a React Three Fiber Canvas.
 * It sets up:
 * - WebGL renderer with antialiasing and ACES filmic tone mapping
 * - Perspective camera with good defaults for tree viewing
 * - Orbit controls for interactive camera manipulation
 * - All scene content (lights, ground, tree) via SceneContent
 *
 * @example
 * ```tsx
 * <SceneSetup
 *   tree={generatedTree}
 *   windStrength={0.5}
 *   wireframe={false}
 * />
 * ```
 */
export function SceneSetup(props: TreeSceneProps) {
  // Get default configurations
  const cameraConfig = defaultCameraConfig()
  const orbitConfig = defaultOrbitControlsConfig()

  return (
    <div className="w-full h-full">
      <Canvas
        // Camera configuration - position, FOV, near/far planes
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: cameraConfig.near,
          far: cameraConfig.far,
        }}
        // Enable shadow maps for realistic lighting
        shadows
        // WebGL renderer configuration
        gl={{
          // Enable antialiasing for smoother edges
          antialias: true,
          // ACES Filmic tone mapping for cinematic look
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        {/* Scene content - lights, ground, tree */}
        <SceneContent {...props} />

        {/* Orbit controls for camera manipulation */}
        {/* Uses spread to apply all config properties */}
        <OrbitControls
          enableDamping={orbitConfig.enableDamping}
          dampingFactor={orbitConfig.dampingFactor}
          minDistance={orbitConfig.minDistance}
          maxDistance={orbitConfig.maxDistance}
          minPolarAngle={orbitConfig.minPolarAngle}
          maxPolarAngle={orbitConfig.maxPolarAngle}
          // Set the target point the camera orbits around
          target={cameraConfig.target}
        />
      </Canvas>
    </div>
  )
}
