/**
 * Skeleton data structures for the tree.
 * The skeleton is an intermediate representation between L-system symbols
 * and final geometry - it captures the tree's topology and measurements.
 */

/** 3D vector representation */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Quaternion for orientation */
export interface Quat {
  x: number
  y: number
  z: number
  w: number
}

/** A node in the tree skeleton - represents a point where something happens */
export interface SkeletonNode {
  /** Unique identifier for this node */
  id: number
  /** Position in 3D space */
  position: Vec3
  /** Orientation as a quaternion */
  orientation: Quat
  /** Branch radius at this point */
  radius: number
  /** ID of parent node, or null for root */
  parentId: number | null
  /** How many branch levels deep this node is */
  depth: number
  /** True if this is the end of a branch (no children continue from here) */
  isTerminal: boolean
  /** True if multiple branches split from this node */
  isBranchPoint: boolean
}

/** A branch segment connecting two nodes */
export interface SkeletonSegment {
  /** ID of the starting node */
  startNodeId: number
  /** ID of the ending node */
  endNodeId: number
  /** Radius at the start of the segment */
  startRadius: number
  /** Radius at the end of the segment */
  endRadius: number
  /** Length of this segment (cached for convenience) */
  length: number
}

/** A point where a leaf should be placed */
export interface LeafPoint {
  /** Position in 3D space */
  position: Vec3
  /** Orientation for the leaf */
  orientation: Quat
  /** Size multiplier for this leaf */
  size: number
}

/** Complete skeleton representing the tree structure */
export interface Skeleton {
  /** All nodes in the tree */
  nodes: SkeletonNode[]
  /** All branch segments */
  segments: SkeletonSegment[]
  /** All leaf placement points */
  leaves: LeafPoint[]
}

/** Configuration for the turtle interpreter */
export interface TurtleConfig {
  /** Starting radius at the trunk base */
  baseRadius: number
  /** Multiplier for radius at each branch depth */
  radiusFalloff: number
  /** World up vector for reference */
  upVector: Vec3
  /** Initial turtle direction */
  forwardVector: Vec3
}

/** Raw geometry data ready for Three.js BufferGeometry */
export interface GeometryData {
  /** Vertex positions (x, y, z per vertex) */
  positions: Float32Array
  /** Vertex normals (x, y, z per vertex) */
  normals: Float32Array
  /** UV coordinates (u, v per vertex) */
  uvs: Float32Array
  /** Triangle indices */
  indices: Uint32Array
}

/** Configuration for branch geometry generation */
export interface BranchGeometryConfig {
  /** Number of vertices per ring around the branch */
  radialSegments: number
  /** How many times the bark texture repeats along the trunk */
  textureRepeatY: number
}

/** Configuration for leaf geometry */
export interface LeafShapeConfig {
  /** Width of a single leaf */
  width: number
  /** Length of a single leaf */
  length: number
  /** How much the leaf curves along its length */
  curvature: number
  /** Subdivisions for smooth curvature */
  segments: number
}

/** Configuration for leaf instancing */
export interface LeafInstanceConfig {
  /** Base RGB color for leaves */
  baseColor: { r: number; g: number; b: number }
  /** How much the color can vary between leaves (0-1) */
  colorVariation: number
  /** How much the size can vary (0-1) */
  sizeVariation: number
  /** Random rotation range in radians */
  rotationScatter: number
  /** Seed for deterministic randomness */
  seed: string
}

/** Per-instance data for leaf rendering */
export interface LeafInstanceData {
  /** 4x4 transformation matrices (16 floats per instance) */
  matrices: Float32Array
  /** RGB colors (3 floats per instance) */
  colors: Float32Array
  /** Total number of leaf instances */
  count: number
}
