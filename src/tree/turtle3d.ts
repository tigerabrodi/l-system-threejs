/**
 * 3D Turtle Interpreter
 *
 * Interprets L-system symbols and produces a tree skeleton.
 * The turtle walks through 3D space, executing commands based on symbols,
 * building up a skeleton of nodes and segments that represent the tree structure.
 *
 * Coordinate system:
 * - Y is up (the turtle starts pointing up)
 * - The turtle's local axes are computed from its orientation quaternion:
 *   - Forward: rotate (0, 1, 0) by orientation
 *   - Right: rotate (1, 0, 0) by orientation
 *   - Up: rotate (0, 0, 1) by orientation
 */

import { vec3, addVec3, scaleVec3 } from '../utils/math'
import type { Vec3 } from '../utils/math'
import {
  identityQuat,
  multiplyQuat,
  quatFromAxisAngle,
  rotateVec3ByQuat,
} from '../utils/quaternion'
import type { Quat } from '../utils/quaternion'
import type { Symbol } from '../lsystem/symbols'
import type {
  Skeleton,
  SkeletonNode,
  SkeletonSegment,
  LeafPoint,
  TurtleConfig,
} from './skeleton'

/**
 * Internal state of the turtle during interpretation.
 * This state is saved/restored when processing push [ and pop ] symbols.
 */
interface TurtleState {
  /** Current position in 3D space */
  position: Vec3
  /** Current orientation as a quaternion */
  orientation: Quat
  /** Current branch radius */
  radius: number
  /** Current branch depth (incremented on push, decremented on pop) */
  depth: number
  /** ID of the current node the turtle is at */
  currentNodeId: number
}

/**
 * Convert degrees to radians
 */
function degreesToRadians(params: { degrees: number }): number {
  return (params.degrees * Math.PI) / 180
}

/**
 * Get the turtle's local forward direction from its orientation.
 * The turtle points "up" (Y axis) by default, so forward is (0, 1, 0) rotated by orientation.
 */
function getForward(params: { orientation: Quat }): Vec3 {
  const forward = vec3({ x: 0, y: 1, z: 0 })
  return rotateVec3ByQuat({ v: forward, q: params.orientation })
}

/**
 * Get the turtle's local right direction from its orientation.
 * Right is (1, 0, 0) rotated by orientation.
 */
function getRight(params: { orientation: Quat }): Vec3 {
  const right = vec3({ x: 1, y: 0, z: 0 })
  return rotateVec3ByQuat({ v: right, q: params.orientation })
}

/**
 * Get the turtle's local up direction from its orientation.
 * Up (perpendicular to forward) is (0, 0, 1) rotated by orientation.
 */
function getUp(params: { orientation: Quat }): Vec3 {
  const up = vec3({ x: 0, y: 0, z: 1 })
  return rotateVec3ByQuat({ v: up, q: params.orientation })
}

/**
 * Create a deep copy of a turtle state for the stack.
 */
function cloneTurtleState(params: { state: TurtleState }): TurtleState {
  const { state } = params
  return {
    position: { ...state.position },
    orientation: { ...state.orientation },
    radius: state.radius,
    depth: state.depth,
    currentNodeId: state.currentNodeId,
  }
}

/**
 * Create a new skeleton node with the given parameters.
 */
function createNode(params: {
  id: number
  position: Vec3
  orientation: Quat
  radius: number
  parentId: number | null
  depth: number
}): SkeletonNode {
  return {
    id: params.id,
    position: { ...params.position },
    orientation: { ...params.orientation },
    radius: params.radius,
    parentId: params.parentId,
    depth: params.depth,
    isTerminal: false, // Will be determined after processing all symbols
    isBranchPoint: false, // Will be determined after processing all symbols
  }
}

/**
 * Create a new skeleton segment connecting two nodes.
 */
function createSegment(params: {
  startNode: SkeletonNode
  endNode: SkeletonNode
  length: number
}): SkeletonSegment {
  return {
    startNodeId: params.startNode.id,
    endNodeId: params.endNode.id,
    startRadius: params.startNode.radius,
    endRadius: params.endNode.radius,
    length: params.length,
  }
}

/**
 * Interpret an L-system sentence and produce a skeleton.
 * Walks through symbols, executing turtle commands to build the tree structure.
 *
 * @param params - Object containing the sentence (array of symbols) and turtle configuration
 * @returns A Skeleton containing nodes, segments, and leaf points
 */
export function interpretSentence(params: {
  sentence: Symbol[]
  config: TurtleConfig
}): Skeleton {
  const { sentence, config } = params

  // Initialize result structures
  const nodes: SkeletonNode[] = []
  const segments: SkeletonSegment[] = []
  const leaves: LeafPoint[] = []

  // Track which nodes have children for branch point detection
  const childCounts: Map<number, number> = new Map()

  // Counter for generating unique node IDs
  let nextNodeId = 0

  // Initialize turtle state: at origin, pointing up, with base radius
  const initialState: TurtleState = {
    position: vec3({ x: 0, y: 0, z: 0 }),
    orientation: identityQuat(),
    radius: config.baseRadius,
    depth: 0,
    currentNodeId: 0,
  }

  // Create the root node at origin
  const rootNode = createNode({
    id: nextNodeId++,
    position: initialState.position,
    orientation: initialState.orientation,
    radius: initialState.radius,
    parentId: null,
    depth: 0,
  })
  nodes.push(rootNode)

  // Stack for saving/restoring state (for [ and ] symbols)
  const stateStack: TurtleState[] = []

  // Current turtle state
  let state = cloneTurtleState({ state: initialState })

  // Process each symbol in the sentence
  for (const sym of sentence) {
    const { symbol, params: symbolParams } = sym

    switch (symbol) {
      case 'F': {
        // Forward: Move forward, create new node and segment
        const length = symbolParams.length ?? 1.0

        // Calculate new position
        const forward = getForward({ orientation: state.orientation })
        const movement = scaleVec3({ v: forward, s: length })
        const newPosition = addVec3({ a: state.position, b: movement })

        // Calculate radius based on depth (radius = baseRadius * radiusFalloff^depth)
        // This ensures consistent radius at each depth level
        const newRadius =
          config.baseRadius * Math.pow(config.radiusFalloff, state.depth)

        // Create new node
        const newNode = createNode({
          id: nextNodeId++,
          position: newPosition,
          orientation: state.orientation,
          radius: newRadius,
          parentId: state.currentNodeId,
          depth: state.depth,
        })
        nodes.push(newNode)

        // Create segment from current node to new node
        const currentNode = nodes.find((n) => n.id === state.currentNodeId)!
        const segment = createSegment({
          startNode: currentNode,
          endNode: newNode,
          length,
        })
        segments.push(segment)

        // Track child count for branch point detection
        const currentCount = childCounts.get(state.currentNodeId) ?? 0
        childCounts.set(state.currentNodeId, currentCount + 1)

        // Update state
        state.position = newPosition
        state.radius = newRadius
        state.currentNodeId = newNode.id
        break
      }

      case '+': {
        // Yaw left: Rotate around local UP axis by positive angle
        const angleDegrees = symbolParams.angle ?? 30
        const angleRadians = degreesToRadians({ degrees: angleDegrees })
        const upAxis = getUp({ orientation: state.orientation })
        const rotation = quatFromAxisAngle({
          axis: upAxis,
          angle: angleRadians,
        })
        state.orientation = multiplyQuat({ a: state.orientation, b: rotation })
        break
      }

      case '-': {
        // Yaw right: Rotate around local UP axis by negative angle
        const angleDegrees = symbolParams.angle ?? 30
        const angleRadians = degreesToRadians({ degrees: -angleDegrees })
        const upAxis = getUp({ orientation: state.orientation })
        const rotation = quatFromAxisAngle({
          axis: upAxis,
          angle: angleRadians,
        })
        state.orientation = multiplyQuat({ a: state.orientation, b: rotation })
        break
      }

      case '^': {
        // Pitch up: Rotate around local RIGHT axis by positive angle
        const angleDegrees = symbolParams.angle ?? 30
        const angleRadians = degreesToRadians({ degrees: angleDegrees })
        const rightAxis = getRight({ orientation: state.orientation })
        const rotation = quatFromAxisAngle({
          axis: rightAxis,
          angle: angleRadians,
        })
        state.orientation = multiplyQuat({ a: state.orientation, b: rotation })
        break
      }

      case '&': {
        // Pitch down: Rotate around local RIGHT axis by negative angle
        const angleDegrees = symbolParams.angle ?? 30
        const angleRadians = degreesToRadians({ degrees: -angleDegrees })
        const rightAxis = getRight({ orientation: state.orientation })
        const rotation = quatFromAxisAngle({
          axis: rightAxis,
          angle: angleRadians,
        })
        state.orientation = multiplyQuat({ a: state.orientation, b: rotation })
        break
      }

      case '/': {
        // Roll right: Rotate around local FORWARD axis by positive angle
        const angleDegrees = symbolParams.angle ?? 30
        const angleRadians = degreesToRadians({ degrees: angleDegrees })
        const forwardAxis = getForward({ orientation: state.orientation })
        const rotation = quatFromAxisAngle({
          axis: forwardAxis,
          angle: angleRadians,
        })
        state.orientation = multiplyQuat({ a: state.orientation, b: rotation })
        break
      }

      case '\\': {
        // Roll left: Rotate around local FORWARD axis by negative angle
        const angleDegrees = symbolParams.angle ?? 30
        const angleRadians = degreesToRadians({ degrees: -angleDegrees })
        const forwardAxis = getForward({ orientation: state.orientation })
        const rotation = quatFromAxisAngle({
          axis: forwardAxis,
          angle: angleRadians,
        })
        state.orientation = multiplyQuat({ a: state.orientation, b: rotation })
        break
      }

      case '[': {
        // Push: Save current state to stack, increment depth
        // Radius will be recalculated when the next F is processed based on the new depth
        stateStack.push(cloneTurtleState({ state }))
        state.depth += 1
        break
      }

      case ']': {
        // Pop: Restore state from stack
        const savedState = stateStack.pop()
        if (savedState) {
          state = savedState
        }
        break
      }

      case 'L': {
        // Leaf: Add a leaf point at current position
        const leafSize = symbolParams.size ?? 1.0
        const leaf: LeafPoint = {
          position: { ...state.position },
          orientation: { ...state.orientation },
          size: leafSize,
        }
        leaves.push(leaf)
        break
      }

      default:
        // Unknown symbols (including X/NOOP) are ignored
        break
    }
  }

  // Post-processing: Mark branch points and terminal nodes

  // Mark branch points (nodes with more than one child)
  for (const [nodeId, count] of childCounts.entries()) {
    if (count > 1) {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        node.isBranchPoint = true
      }
    }
  }

  // Mark terminal nodes (nodes that have no outgoing segments)
  // First, collect all nodes that ARE start points of segments
  const nodesWithOutgoingSegments = new Set(segments.map((s) => s.startNodeId))

  // Nodes without outgoing segments are terminal
  for (const node of nodes) {
    if (!nodesWithOutgoingSegments.has(node.id)) {
      node.isTerminal = true
    }
  }

  return {
    nodes,
    segments,
    leaves,
  }
}
