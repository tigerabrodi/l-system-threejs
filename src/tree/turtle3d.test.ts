/**
 * 3D Turtle Interpreter Tests
 *
 * Tests for the 3D turtle graphics interpreter that converts L-system symbols
 * into a tree skeleton. Following TDD: tests written first, then implementation.
 *
 * The turtle starts at the origin pointing up (Y axis), with identity orientation.
 * Commands move it through 3D space, building up a skeleton of nodes and segments.
 */

import { describe, expect, test } from 'bun:test'
import { interpretSentence } from './turtle3d'
import { vec3 } from '../utils/math'
import type { Symbol } from '../lsystem/symbols'
import type { TurtleConfig } from './skeleton'

/**
 * Helper function to create a symbol with default params
 */
function sym(
  symbol: string,
  params: { length?: number; angle?: number; size?: number } = {}
): Symbol {
  return { symbol, params }
}

/**
 * Default turtle config for testing
 */
function defaultConfig(): TurtleConfig {
  return {
    baseRadius: 1.0,
    radiusFalloff: 0.7,
    upVector: vec3({ x: 0, y: 1, z: 0 }),
    forwardVector: vec3({ x: 0, y: 1, z: 0 }),
  }
}

describe('3D Turtle Interpreter', () => {
  // Test 1: single F creates two nodes and one segment
  test('single F creates two nodes and one segment', () => {
    const sentence: Symbol[] = [sym('F', { length: 1.0 })]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should have 2 nodes: root at origin, and end node at (0, 1, 0)
    expect(skeleton.nodes.length).toBe(2)

    // Root node (id=0) at origin
    const rootNode = skeleton.nodes[0]
    expect(rootNode.id).toBe(0)
    expect(rootNode.position.x).toBeCloseTo(0)
    expect(rootNode.position.y).toBeCloseTo(0)
    expect(rootNode.position.z).toBeCloseTo(0)
    expect(rootNode.parentId).toBeNull()

    // End node (id=1) at (0, 1, 0) - moved forward along Y axis
    const endNode = skeleton.nodes[1]
    expect(endNode.id).toBe(1)
    expect(endNode.position.x).toBeCloseTo(0)
    expect(endNode.position.y).toBeCloseTo(1.0)
    expect(endNode.position.z).toBeCloseTo(0)
    expect(endNode.parentId).toBe(0)

    // Should have 1 segment connecting them
    expect(skeleton.segments.length).toBe(1)
    const segment = skeleton.segments[0]
    expect(segment.startNodeId).toBe(0)
    expect(segment.endNodeId).toBe(1)
    expect(segment.length).toBeCloseTo(1.0)
  })

  // Test 2: multiple F in sequence creates chain
  test('multiple F in sequence creates chain', () => {
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('F', { length: 1.0 }),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should have 4 nodes: root + 3 forward moves
    expect(skeleton.nodes.length).toBe(4)

    // Should have 3 segments
    expect(skeleton.segments.length).toBe(3)

    // Verify positions form a chain along Y axis
    expect(skeleton.nodes[0].position.y).toBeCloseTo(0)
    expect(skeleton.nodes[1].position.y).toBeCloseTo(1)
    expect(skeleton.nodes[2].position.y).toBeCloseTo(2)
    expect(skeleton.nodes[3].position.y).toBeCloseTo(3)

    // Verify parent chain
    expect(skeleton.nodes[1].parentId).toBe(0)
    expect(skeleton.nodes[2].parentId).toBe(1)
    expect(skeleton.nodes[3].parentId).toBe(2)
  })

  // Test 3: + rotates turtle heading (yaw left)
  test('+ rotates turtle heading (yaw left)', () => {
    // Yaw left by 90 degrees, then move forward
    const sentence: Symbol[] = [
      sym('+', { angle: 90 }),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should have 2 nodes
    expect(skeleton.nodes.length).toBe(2)

    // Root at origin
    expect(skeleton.nodes[0].position.x).toBeCloseTo(0)
    expect(skeleton.nodes[0].position.y).toBeCloseTo(0)
    expect(skeleton.nodes[0].position.z).toBeCloseTo(0)

    // End node: yaw left 90 degrees around local up (Z), then move forward (Y)
    // Local UP is (0, 0, 1), rotating around it by 90 degrees
    // rotates forward (0, 1, 0) to approximately (-1, 0, 0) or (1, 0, 0) depending on sign
    const endNode = skeleton.nodes[1]
    // After yawing left 90 degrees, forward should be approximately (-1, 0, 0)
    expect(endNode.position.x).toBeCloseTo(-1, 1)
    expect(endNode.position.y).toBeCloseTo(0, 1)
    expect(endNode.position.z).toBeCloseTo(0, 1)
  })

  // Test 4: - rotates turtle heading opposite direction (yaw right)
  test('- rotates turtle heading opposite direction', () => {
    const sentence: Symbol[] = [
      sym('-', { angle: 90 }),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    expect(skeleton.nodes.length).toBe(2)

    // End node: yaw right 90 degrees (opposite of yaw left)
    const endNode = skeleton.nodes[1]
    expect(endNode.position.x).toBeCloseTo(1, 1)
    expect(endNode.position.y).toBeCloseTo(0, 1)
    expect(endNode.position.z).toBeCloseTo(0, 1)
  })

  // Test 5: ^ and & pitch the turtle
  test('^ and & pitch the turtle', () => {
    // Pitch up by 90 degrees, then move forward
    const sentenceUp: Symbol[] = [
      sym('^', { angle: 90 }),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeletonUp = interpretSentence({ sentence: sentenceUp, config })

    // After pitching up 90 degrees, forward (Y) becomes (0, 0, -1) or similar
    // Moving forward should go along the new forward direction
    const endNodeUp = skeletonUp.nodes[1]
    expect(endNodeUp.position.y).toBeCloseTo(0, 1)
    // Z component should be non-zero
    expect(Math.abs(endNodeUp.position.z)).toBeGreaterThan(0.5)

    // Pitch down by 90 degrees
    const sentenceDown: Symbol[] = [
      sym('&', { angle: 90 }),
      sym('F', { length: 1.0 }),
    ]

    const skeletonDown = interpretSentence({ sentence: sentenceDown, config })
    const endNodeDown = skeletonDown.nodes[1]

    // Pitch down should be opposite of pitch up
    expect(endNodeDown.position.y).toBeCloseTo(0, 1)
    expect(endNodeDown.position.z).toBeCloseTo(-endNodeUp.position.z, 1)
  })

  // Test 6: / and \\ roll the turtle
  test('/ and \\\\ roll the turtle', () => {
    // Roll right 90 degrees, then pitch up 90 degrees, then move forward
    // This tests that roll changes the local axes correctly
    const sentenceRollRight: Symbol[] = [
      sym('/', { angle: 90 }),
      sym('^', { angle: 90 }),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeletonRight = interpretSentence({
      sentence: sentenceRollRight,
      config,
    })
    const endNodeRight = skeletonRight.nodes[1]

    // Roll left 90 degrees, then pitch up 90 degrees, then move forward
    const sentenceRollLeft: Symbol[] = [
      sym('\\', { angle: 90 }),
      sym('^', { angle: 90 }),
      sym('F', { length: 1.0 }),
    ]

    const skeletonLeft = interpretSentence({
      sentence: sentenceRollLeft,
      config,
    })
    const endNodeLeft = skeletonLeft.nodes[1]

    // Rolling right vs left should produce different results when followed by pitch
    // The X components should be opposite
    expect(endNodeRight.position.x).toBeCloseTo(-endNodeLeft.position.x, 1)
  })

  // Test 7: [ and ] save and restore state
  test('[ and ] save and restore state', () => {
    // Move forward, push, turn, move, pop, move forward again
    // The final position should be as if we only moved forward twice
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('['), // Push state
      sym('+', { angle: 90 }), // Turn left
      sym('F', { length: 1.0 }), // Move sideways
      sym(']'), // Pop state (back to after first F)
      sym('F', { length: 1.0 }), // Continue forward
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should have 4 nodes: root, first forward, branch end, continuation
    expect(skeleton.nodes.length).toBe(4)

    // Node 0: origin
    expect(skeleton.nodes[0].position.y).toBeCloseTo(0)

    // Node 1: after first F, at y=1
    expect(skeleton.nodes[1].position.y).toBeCloseTo(1)

    // Node 2: the branch (sideways from node 1)
    expect(skeleton.nodes[2].parentId).toBe(1)
    expect(skeleton.nodes[2].position.x).toBeCloseTo(-1, 1) // Turned left

    // Node 3: continuation (should be at y=2, branching from node 1)
    expect(skeleton.nodes[3].parentId).toBe(1)
    expect(skeleton.nodes[3].position.y).toBeCloseTo(2)
  })

  // Test 8: branch point is marked correctly
  test('branch point is marked correctly', () => {
    // Create a branch point: forward, push, forward, pop, forward
    // Node 1 should be marked as a branch point because two segments originate from it
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('['),
      sym('F', { length: 1.0 }),
      sym(']'),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Node 1 is a branch point (has two children)
    const node1 = skeleton.nodes.find((n) => n.id === 1)
    expect(node1?.isBranchPoint).toBe(true)

    // Root and terminals are not branch points
    expect(skeleton.nodes[0].isBranchPoint).toBe(false)
  })

  // Test 9: terminal nodes are marked correctly
  test('terminal nodes are marked correctly', () => {
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('['),
      sym('F', { length: 1.0 }),
      sym(']'),
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Nodes that have no outgoing segments are terminal
    // In this case: node 2 (branch end) and node 3 (main trunk end)
    const node2 = skeleton.nodes.find((n) => n.id === 2)
    const node3 = skeleton.nodes.find((n) => n.id === 3)

    expect(node2?.isTerminal).toBe(true)
    expect(node3?.isTerminal).toBe(true)

    // Nodes 0 and 1 are not terminal
    expect(skeleton.nodes[0].isTerminal).toBe(false)
    expect(skeleton.nodes[1].isTerminal).toBe(false)
  })

  // Test 10: L symbol creates leaf point
  test('L symbol creates leaf point', () => {
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('L', { size: 0.5 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should have one leaf
    expect(skeleton.leaves.length).toBe(1)

    // Leaf should be at the current turtle position (after F)
    const leaf = skeleton.leaves[0]
    expect(leaf.position.x).toBeCloseTo(0)
    expect(leaf.position.y).toBeCloseTo(1.0)
    expect(leaf.position.z).toBeCloseTo(0)
    expect(leaf.size).toBeCloseTo(0.5)
  })

  // Test 11: radius decreases with depth
  test('radius decreases with depth', () => {
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('['),
      sym('F', { length: 1.0 }),
      sym('['),
      sym('F', { length: 1.0 }),
      sym(']'),
      sym(']'),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Depth 0 (root) should have baseRadius
    expect(skeleton.nodes[0].radius).toBeCloseTo(config.baseRadius)
    expect(skeleton.nodes[0].depth).toBe(0)

    // After first push, depth increases
    // Node 2 is after first push and first F inside
    const node2 = skeleton.nodes.find((n) => n.id === 2)
    expect(node2?.depth).toBe(1)
    expect(node2?.radius).toBeCloseTo(config.baseRadius * config.radiusFalloff)

    // Node 3 is after second push
    const node3 = skeleton.nodes.find((n) => n.id === 3)
    expect(node3?.depth).toBe(2)
    expect(node3?.radius).toBeCloseTo(
      config.baseRadius * config.radiusFalloff * config.radiusFalloff
    )
  })

  // Test 12: empty sentence produces only root node
  test('empty sentence produces only root node', () => {
    const sentence: Symbol[] = []
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should have just the root node
    expect(skeleton.nodes.length).toBe(1)
    expect(skeleton.segments.length).toBe(0)
    expect(skeleton.leaves.length).toBe(0)

    // Root is at origin
    expect(skeleton.nodes[0].position.x).toBeCloseTo(0)
    expect(skeleton.nodes[0].position.y).toBeCloseTo(0)
    expect(skeleton.nodes[0].position.z).toBeCloseTo(0)
  })

  // Test 13: segment has correct start and end radii
  test('segment has correct start and end radii', () => {
    const sentence: Symbol[] = [sym('F', { length: 1.0 })]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    const segment = skeleton.segments[0]
    // Start radius should be the radius of node 0
    // End radius should be the radius of node 1
    expect(segment.startRadius).toBeCloseTo(skeleton.nodes[0].radius)
    expect(segment.endRadius).toBeCloseTo(skeleton.nodes[1].radius)
  })

  // Test 14: unknown symbols are ignored
  test('unknown symbols are ignored', () => {
    const sentence: Symbol[] = [
      sym('F', { length: 1.0 }),
      sym('X'), // NOOP symbol - should be ignored
      sym('Q'), // Unknown symbol - should be ignored
      sym('F', { length: 1.0 }),
    ]
    const config = defaultConfig()

    const skeleton = interpretSentence({ sentence, config })

    // Should still produce correct result: 3 nodes, 2 segments
    expect(skeleton.nodes.length).toBe(3)
    expect(skeleton.segments.length).toBe(2)
  })
})
