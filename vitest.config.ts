import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for the procedural tree generator.
 * Uses node environment since our TDD modules are pure logic without DOM deps.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
})
