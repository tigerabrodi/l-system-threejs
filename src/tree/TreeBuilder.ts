/**
 * Tree Builder Module
 *
 * Orchestrates the complete tree generation pipeline by combining:
 * - L-system sentence generation
 * - Turtle interpretation to skeleton
 * - Branch geometry creation
 * - Leaf geometry and instancing
 * - Three.js mesh assembly
 *
 * This is the main entry point for generating complete 3D trees.
 */

import * as THREE from 'three'
import { generateSentence } from '../lsystem/engine'
import { interpretSentence } from './turtle3d'
import { buildBranchGeometry } from './branchGeometry'
import { createLeafShape, buildLeafInstances } from './leafGeometry'
import {
  createBarkMaterial,
  createLeafMaterial,
  defaultBarkMaterialConfig,
  defaultLeafMaterialConfig,
} from './materials'
import type { LSystem } from '../lsystem/symbols'
import type {
  TurtleConfig,
  BranchGeometryConfig,
  LeafShapeConfig,
  LeafInstanceConfig,
} from './skeleton'

/**
 * Complete configuration for tree generation.
 * Contains all parameters needed to generate a full tree from L-system to mesh.
 */
export interface TreeConfig {
  /** L-system definition (axiom, rules, and generation config) */
  lsystem: LSystem
  /** Number of L-system iterations to apply */
  iterations: number
  /** Random seed for deterministic generation */
  seed: string
  /** Turtle interpreter configuration */
  turtleConfig: TurtleConfig
  /** Branch geometry configuration */
  branchConfig: BranchGeometryConfig
  /** Leaf shape configuration */
  leafShapeConfig: LeafShapeConfig
  /** Leaf instance configuration */
  leafInstanceConfig: LeafInstanceConfig
}

/**
 * Result of tree generation.
 * Contains all Three.js objects and statistics about the generated tree.
 */
export interface TreeResult {
  /** The complete tree as a Three.js Group (contains branch and leaf meshes) */
  group: THREE.Group
  /** Branch mesh with bark material */
  branchMesh: THREE.Mesh
  /** Leaf instanced mesh (or null if no leaves were generated) */
  leafMesh: THREE.InstancedMesh | null
  /** Statistics about the generated tree */
  stats: TreeStats
}

/**
 * Statistics about the generated tree.
 * Useful for debugging and performance monitoring.
 */
export interface TreeStats {
  /** Total triangle count across all meshes */
  triangleCount: number
  /** Number of branch segments in the skeleton */
  segmentCount: number
  /** Number of leaf instances */
  leafCount: number
  /** Number of L-system symbols after full expansion */
  symbolCount: number
}

/**
 * Parameters for the buildTree function.
 */
export interface BuildTreeParams {
  /** Complete tree configuration */
  config: TreeConfig
}

/**
 * Build a complete tree from configuration.
 *
 * This is the main entry point for tree generation. It orchestrates the entire
 * pipeline from L-system expansion through to Three.js mesh creation.
 *
 * Pipeline steps:
 * 1. Generate L-system sentence by iteratively applying rules
 * 2. Interpret sentence with 3D turtle to create skeleton
 * 3. Build branch geometry from skeleton segments
 * 4. Build leaf geometry and instance data
 * 5. Create Three.js BufferGeometry from raw arrays
 * 6. Create materials (bark and leaf)
 * 7. Create meshes (Mesh for branches, InstancedMesh for leaves)
 * 8. Group meshes together
 * 9. Calculate statistics
 *
 * @param params - Object containing the complete tree configuration
 * @returns TreeResult with Three.js objects and statistics
 *
 * @example
 * ```typescript
 * const config = defaultTreeConfig()
 * const result = buildTree({ config })
 * scene.add(result.group)
 * console.log(`Generated tree with ${result.stats.leafCount} leaves`)
 * ```
 */
export function buildTree(params: BuildTreeParams): TreeResult {
  const { config } = params

  // Step 1: Generate L-system sentence
  // Expands the axiom through multiple iterations using the defined rules
  const sentence = generateSentence({
    lsystem: config.lsystem,
    iterations: config.iterations,
    seed: config.seed,
  })

  // Step 2: Interpret sentence to create skeleton
  // The turtle walks through 3D space, creating nodes and segments
  const skeleton = interpretSentence({
    sentence,
    config: config.turtleConfig,
  })

  // Step 3: Build branch geometry from skeleton
  // Generates vertex positions, normals, UVs, and indices for cylindrical branches
  const branchGeometryData = buildBranchGeometry({
    skeleton,
    config: config.branchConfig,
  })

  // Step 4: Create Three.js BufferGeometry for branches
  const branchGeometry = new THREE.BufferGeometry()

  // Set position attribute (3 components per vertex: x, y, z)
  branchGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(branchGeometryData.positions, 3)
  )

  // Set normal attribute (3 components per vertex: nx, ny, nz)
  branchGeometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(branchGeometryData.normals, 3)
  )

  // Set UV attribute (2 components per vertex: u, v)
  branchGeometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(branchGeometryData.uvs, 2)
  )

  // Set index buffer for triangle faces
  branchGeometry.setIndex(new THREE.BufferAttribute(branchGeometryData.indices, 1))

  // Step 5: Create bark material
  const barkMaterial = createBarkMaterial({
    config: defaultBarkMaterialConfig(),
  })

  // Step 6: Create branch mesh
  const branchMesh = new THREE.Mesh(branchGeometry, barkMaterial)
  branchMesh.name = 'branches'
  branchMesh.castShadow = true
  branchMesh.receiveShadow = true

  // Calculate branch triangle count
  const branchTriangleCount = branchGeometryData.indices.length / 3

  // Step 7: Build leaf geometry and instances (if there are leaves)
  let leafMesh: THREE.InstancedMesh | null = null
  let leafTriangleCount = 0

  if (skeleton.leaves.length > 0) {
    // Create the base leaf shape geometry (reused for all instances)
    const leafShapeData = createLeafShape({
      config: config.leafShapeConfig,
    })

    // Create Three.js BufferGeometry for leaf shape
    const leafGeometry = new THREE.BufferGeometry()

    leafGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(leafShapeData.positions, 3)
    )

    leafGeometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(leafShapeData.normals, 3)
    )

    leafGeometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(leafShapeData.uvs, 2)
    )

    leafGeometry.setIndex(new THREE.BufferAttribute(leafShapeData.indices, 1))

    // Build per-instance data (transformation matrices and colors)
    const leafInstanceData = buildLeafInstances({
      leaves: skeleton.leaves,
      config: config.leafInstanceConfig,
    })

    // Create leaf material
    const leafMaterial = createLeafMaterial({
      config: defaultLeafMaterialConfig(),
    })

    // Create InstancedMesh for efficient rendering of many leaves
    leafMesh = new THREE.InstancedMesh(
      leafGeometry,
      leafMaterial,
      leafInstanceData.count
    )
    leafMesh.name = 'leaves'
    leafMesh.castShadow = true
    leafMesh.receiveShadow = true

    // Apply instance matrices
    // The instanceMatrix is a special attribute that stores 4x4 transformation matrices
    // for each instance. We copy our pre-computed matrices directly into it.
    leafMesh.instanceMatrix.set(leafInstanceData.matrices)
    leafMesh.instanceMatrix.needsUpdate = true

    // Apply instance colors
    // InstancedMesh supports per-instance colors via the instanceColor attribute
    if (leafInstanceData.count > 0) {
      // Create the instanceColor attribute with our color data
      leafMesh.instanceColor = new THREE.InstancedBufferAttribute(
        leafInstanceData.colors,
        3 // RGB: 3 components per color
      )
    }

    // Calculate leaf triangle count (per shape * number of instances)
    const trianglesPerLeaf = leafShapeData.indices.length / 3
    leafTriangleCount = trianglesPerLeaf * leafInstanceData.count
  }

  // Step 8: Group meshes together
  const group = new THREE.Group()
  group.name = 'tree'
  group.add(branchMesh)

  if (leafMesh) {
    group.add(leafMesh)
  }

  // Step 9: Calculate statistics
  const stats: TreeStats = {
    triangleCount: branchTriangleCount + leafTriangleCount,
    segmentCount: skeleton.segments.length,
    leafCount: skeleton.leaves.length,
    symbolCount: sentence.length,
  }

  return {
    group,
    branchMesh,
    leafMesh,
    stats,
  }
}

/**
 * Create a default tree configuration.
 *
 * Returns a configuration that produces a simple branching tree structure.
 * This is useful as a starting point for customization or for testing.
 *
 * The default L-system creates a tree with:
 * - A trunk that branches at each iteration
 * - Leaves at branch tips
 * - Natural-looking angles and length falloff
 *
 * @returns A complete TreeConfig with sensible defaults
 *
 * @example
 * ```typescript
 * // Use defaults directly
 * const result = buildTree({ config: defaultTreeConfig() })
 *
 * // Or modify defaults
 * const config = defaultTreeConfig()
 * config.iterations = 5 // More complex tree
 * config.seed = 'my-custom-seed'
 * const result = buildTree({ config })
 * ```
 */
export function defaultTreeConfig(): TreeConfig {
  // Default L-system creates a simple branching tree
  // Axiom: X (placeholder that expands into branching structure)
  // Rules:
  // - X becomes a branch with two sub-branches and a leaf
  // - F remains F (forward movement)
  const lsystem: LSystem = {
    axiom: 'X',
    rules: [
      {
        match: 'X',
        odds: 1.0,
        // Create a branch segment, then split into two sub-branches with leaves
        produce: 'F[+X][-X]FL',
      },
      {
        match: 'F',
        odds: 1.0,
        // F produces FF for gradual growth
        produce: 'FF',
      },
    ],
    config: {
      // Base length of branch segments (world units)
      baseLength: 0.5,
      // Base radius at trunk (world units)
      baseRadius: 0.1,
      // Length multiplier per depth level (branches get shorter)
      lengthFalloff: 0.85,
      // Radius multiplier per depth level (branches get thinner)
      radiusFalloff: 0.7,
      // Default branching angle in degrees
      branchAngle: 25,
      // Randomness factor (0 = deterministic, 1 = highly varied)
      variability: 0.15,
    },
  }

  // Turtle configuration for interpreting the L-system
  const turtleConfig: TurtleConfig = {
    // Starting radius at the base of the trunk
    baseRadius: 0.1,
    // How much radius decreases per branch depth
    radiusFalloff: 0.7,
    // World up vector (Y-up coordinate system)
    upVector: { x: 0, y: 1, z: 0 },
    // Initial direction the turtle faces (up)
    forwardVector: { x: 0, y: 1, z: 0 },
  }

  // Branch geometry configuration
  const branchConfig: BranchGeometryConfig = {
    // Number of vertices around each branch ring (higher = smoother)
    radialSegments: 8,
    // How many times the bark texture repeats along trunk length
    textureRepeatY: 2.0,
  }

  // Leaf shape configuration
  const leafShapeConfig: LeafShapeConfig = {
    // Width of each leaf (world units)
    width: 0.15,
    // Length of each leaf (world units)
    length: 0.25,
    // Backward curvature amount (0 = flat, higher = more curved)
    curvature: 0.1,
    // Subdivisions along leaf length for smooth curvature
    segments: 2,
  }

  // Leaf instance configuration
  const leafInstanceConfig: LeafInstanceConfig = {
    // Base green color for leaves (forest green)
    baseColor: { r: 0.13, g: 0.55, b: 0.13 },
    // How much color can vary between leaves (adds visual interest)
    colorVariation: 0.1,
    // How much leaf size can vary
    sizeVariation: 0.2,
    // Random rotation scatter in radians (adds natural variation)
    rotationScatter: 0.3,
    // Seed for deterministic leaf variation
    seed: 'leaves',
  }

  return {
    lsystem,
    iterations: 4,
    seed: 'default-tree',
    turtleConfig,
    branchConfig,
    leafShapeConfig,
    leafInstanceConfig,
  }
}
