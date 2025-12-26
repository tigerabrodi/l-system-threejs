/**
 * Procedural Tree Generator - Main Application
 *
 * A browser-based tool for generating realistic 3D procedural trees
 * using L-systems. Features real-time parameter tweaking, wind animation,
 * and export to GLTF/GLB formats.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  copyConfigToClipboard,
  downloadTreeAsGLB,
  downloadTreeAsGLTF,
} from './export/gltfExport'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useTreeGenerator } from './hooks/useTreeGenerator'
import { SceneSetup } from './scene/SceneSetup'
import { ControlPanel } from './ui/ControlPanel'

/**
 * Root application component.
 * Manages the tree generator state and renders the UI + 3D viewport.
 */
function App() {
  // Tree generation hook
  const {
    tree,
    stats,
    params,
    setParam,
    regenerate,
    randomizeSeed,
    presetNames,
    isGenerating,
  } = useTreeGenerator()

  // View state
  const [wireframe, setWireframe] = useState(false)
  const [windStrength, setWindStrength] = useState(0.3)

  // Debounce expensive parameters to avoid regenerating on every slider tick
  const debouncedIterations = useDebouncedValue({
    value: params.iterations,
    delay: 300,
  })
  const debouncedVariability = useDebouncedValue({
    value: params.variability,
    delay: 300,
  })
  const debouncedBaseLength = useDebouncedValue({
    value: params.baseLength,
    delay: 300,
  })
  const debouncedBaseRadius = useDebouncedValue({
    value: params.baseRadius,
    delay: 300,
  })
  const debouncedBranchAngle = useDebouncedValue({
    value: params.branchAngle,
    delay: 300,
  })
  const debouncedLeafSize = useDebouncedValue({
    value: params.leafSize,
    delay: 300,
  })

  // Regenerate tree when debounced params change
  useEffect(() => {
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedIterations,
    debouncedVariability,
    debouncedBaseLength,
    debouncedBaseRadius,
    debouncedBranchAngle,
    debouncedLeafSize,
    params.seed,
    params.preset,
    params.leafDensity,
    params.leafColor,
    params.lengthFalloff,
    params.radiusFalloff,
  ])

  // Generate initial tree on mount
  useEffect(() => {
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Parameter change handler
  const handleParamChange = useCallback(
    <K extends keyof typeof params>(key: K, value: (typeof params)[K]) => {
      setParam({ key, value })
    },
    [setParam]
  )

  // Export handlers
  const handleExportGLB = useCallback(async () => {
    if (tree?.group) {
      await downloadTreeAsGLB({ treeGroup: tree.group })
    }
  }, [tree])

  const handleExportGLTF = useCallback(async () => {
    if (tree?.group) {
      await downloadTreeAsGLTF({ treeGroup: tree.group })
    }
  }, [tree])

  const handleCopyConfig = useCallback(async () => {
    await copyConfigToClipboard({ config: params as unknown as Record<string, unknown> })
  }, [params])

  return (
    <div className="w-screen h-screen flex bg-stone-100">
      {/* Control Panel - Left Sidebar */}
      <ControlPanel
        params={params}
        presetNames={presetNames}
        stats={stats}
        onParamChange={handleParamChange}
        onRegenerate={regenerate}
        onRandomizeSeed={randomizeSeed}
        onExportGLB={handleExportGLB}
        onExportGLTF={handleExportGLTF}
        onCopyConfig={handleCopyConfig}
        wireframe={wireframe}
        onWireframeChange={setWireframe}
      />

      {/* 3D Viewport - Main Area */}
      <main className="flex-1 relative">
        <SceneSetup
          tree={tree}
          windStrength={windStrength}
          wireframe={wireframe}
        />

        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center">
            <div className="bg-white rounded-lg px-4 py-2 shadow-lg text-stone-700">
              Generating...
            </div>
          </div>
        )}

        {/* Wind control - bottom right */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <span>Wind</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={windStrength}
              onChange={(e) => setWindStrength(parseFloat(e.target.value))}
              className="w-20 accent-amber-600"
            />
          </label>
        </div>
      </main>
    </div>
  )
}

export default App
