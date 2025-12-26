/**
 * Control Panel Component
 *
 * Main sidebar panel containing all tree customization controls.
 * Organized into logical sections: presets, structure, branches, leaves, view, and stats.
 * Uses a warm beige color scheme with Tailwind CSS for styling.
 */

import { RefreshCw, Shuffle } from 'lucide-react'
import type { TreeParams } from '../hooks/useTreeGenerator'
import type { TreeStats } from '../tree/TreeBuilder'
import { ColorPicker } from './ColorPicker'
import { ExportButton } from './ExportButton'
import { PresetSelector } from './PresetSelector'
import { SeedInput } from './SeedInput'
import { SliderControl } from './SliderControl'

/**
 * Props for the ControlPanel component.
 * Contains all state and callbacks needed to control tree generation.
 */
interface ControlPanelProps {
  /** Current tree parameters */
  params: TreeParams
  /** Available preset names */
  presetNames: string[]
  /** Tree statistics (triangle count, etc.) */
  stats: TreeStats | null
  /** Update a single parameter */
  onParamChange: <K extends keyof TreeParams>(
    key: K,
    value: TreeParams[K]
  ) => void
  /** Regenerate the tree */
  onRegenerate: () => void
  /** Randomize the seed */
  onRandomizeSeed: () => void
  /** Export callbacks */
  onExportGLB: () => void
  onExportGLTF: () => void
  onCopyConfig: () => void
  /** Wireframe toggle */
  wireframe: boolean
  onWireframeChange: (enabled: boolean) => void
}

/**
 * Format a number with thousands separators for display.
 * Example: 12345 becomes "12,345"
 *
 * @param num - Number to format
 * @returns Formatted string with commas as thousands separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Section header component for visual organization.
 * Displays uppercase muted text with consistent styling.
 */
function SectionHeader({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
      {children}
    </h3>
  )
}

/**
 * Section divider component for visual separation between sections.
 */
function SectionDivider() {
  return <div className="border-t border-stone-200 my-4" />
}

/**
 * Main control panel component.
 *
 * Provides a comprehensive UI for customizing procedural tree generation.
 * Organized into sections:
 * - Presets: Quick selection of pre-configured tree types
 * - Structure: Core tree parameters (iterations, seed, variability)
 * - Branches: Branch appearance (length, thickness, angle)
 * - Leaves: Leaf appearance (size, density, color)
 * - View: Display options (wireframe mode)
 * - Stats: Generation statistics (triangles, segments, leaves)
 * - Actions: Regenerate, randomize, and export buttons
 *
 * @param props - Control panel props containing state and callbacks
 * @returns The rendered control panel sidebar
 *
 * @example
 * ```tsx
 * <ControlPanel
 *   params={params}
 *   presetNames={presetNames}
 *   stats={stats}
 *   onParamChange={(key, value) => setParam({ key, value })}
 *   onRegenerate={regenerate}
 *   onRandomizeSeed={randomizeSeed}
 *   onExportGLB={exportGLB}
 *   onExportGLTF={exportGLTF}
 *   onCopyConfig={copyConfig}
 *   wireframe={wireframe}
 *   onWireframeChange={setWireframe}
 * />
 * ```
 */
export function ControlPanel(props: ControlPanelProps) {
  const {
    params,
    presetNames,
    stats,
    onParamChange,
    onRegenerate,
    onRandomizeSeed,
    onExportGLB,
    onExportGLTF,
    onCopyConfig,
    wireframe,
    onWireframeChange,
  } = props

  return (
    <aside
      className="
        w-72 h-full
        bg-stone-50 border-r border-stone-200
        flex flex-col
        overflow-hidden
      "
      aria-label="Tree controls"
    >
      {/* Panel header with title */}
      <header className="px-4 py-4 border-b border-stone-200 bg-white">
        <h1 className="text-lg font-semibold text-stone-800">
          Procedural Trees
        </h1>
        <p className="text-xs text-stone-500 mt-1">L-System Tree Generator</p>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* ─────────────────────────────────────────────────────────────
            PRESETS SECTION
            Quick selection of pre-configured tree types
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader>Presets</SectionHeader>
          <PresetSelector
            value={params.preset}
            options={presetNames}
            onChange={(value) => onParamChange('preset', value)}
          />
        </section>

        <SectionDivider />

        {/* ─────────────────────────────────────────────────────────────
            STRUCTURE SECTION
            Core tree generation parameters
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader>Structure</SectionHeader>

          {/* Iterations: Controls tree complexity/depth */}
          <SliderControl
            label="Iterations"
            value={params.iterations}
            min={1}
            max={7}
            step={1}
            onChange={(value) => onParamChange('iterations', value)}
          />

          {/* Seed input with randomize button */}
          <div className="mt-3">
            <SeedInput
              value={params.seed}
              onChange={(value) => onParamChange('seed', value)}
              onRandomize={onRandomizeSeed}
            />
          </div>

          {/* Variability: Amount of randomness in tree generation */}
          <div className="mt-3">
            <SliderControl
              label="Variability"
              value={params.variability}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(value) => onParamChange('variability', value)}
            />
          </div>
        </section>

        <SectionDivider />

        {/* ─────────────────────────────────────────────────────────────
            BRANCHES SECTION
            Branch appearance parameters
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader>Branches</SectionHeader>

          {/* Length: Base branch segment length */}
          <SliderControl
            label="Length"
            value={params.baseLength}
            min={0.3}
            max={2.0}
            step={0.1}
            onChange={(value) => onParamChange('baseLength', value)}
          />

          {/* Thickness: Base trunk radius */}
          <div className="mt-3">
            <SliderControl
              label="Thickness"
              value={params.baseRadius}
              min={0.05}
              max={0.3}
              step={0.01}
              onChange={(value) => onParamChange('baseRadius', value)}
            />
          </div>

          {/* Angle: Branch divergence angle */}
          <div className="mt-3">
            <SliderControl
              label="Angle"
              value={params.branchAngle}
              min={15}
              max={60}
              step={1}
              onChange={(value) => onParamChange('branchAngle', value)}
            />
          </div>
        </section>

        <SectionDivider />

        {/* ─────────────────────────────────────────────────────────────
            LEAVES SECTION
            Leaf appearance parameters
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader>Leaves</SectionHeader>

          {/* Size: Leaf scale multiplier */}
          <SliderControl
            label="Size"
            value={params.leafSize}
            min={0.2}
            max={2.0}
            step={0.1}
            onChange={(value) => onParamChange('leafSize', value)}
          />

          {/* Density: Probability of leaf placement */}
          <div className="mt-3">
            <SliderControl
              label="Density"
              value={params.leafDensity}
              min={0}
              max={1}
              step={0.1}
              onChange={(value) => onParamChange('leafDensity', value)}
            />
          </div>

          {/* Color: Leaf color picker */}
          <div className="mt-3">
            <ColorPicker
              label="Color"
              value={params.leafColor}
              onChange={(value) => onParamChange('leafColor', value)}
            />
          </div>
        </section>

        <SectionDivider />

        {/* ─────────────────────────────────────────────────────────────
            VIEW SECTION
            Display and rendering options
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader>View</SectionHeader>

          {/* Wireframe toggle checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => onWireframeChange(e.target.checked)}
              className="
                w-4 h-4 rounded
                border-stone-300
                text-amber-600
                focus:ring-amber-500 focus:ring-offset-0
              "
            />
            <span className="text-sm text-stone-700">Wireframe</span>
          </label>
        </section>

        <SectionDivider />

        {/* ─────────────────────────────────────────────────────────────
            STATS SECTION
            Tree generation statistics
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader>Stats</SectionHeader>

          {stats ? (
            <div className="space-y-1 text-sm">
              {/* Triangle count - important for performance monitoring */}
              <div className="flex justify-between text-stone-600">
                <span>Triangles:</span>
                <span className="font-mono text-stone-800">
                  {formatNumber(stats.triangleCount)}
                </span>
              </div>

              {/* Segment count - number of branch segments */}
              <div className="flex justify-between text-stone-600">
                <span>Segments:</span>
                <span className="font-mono text-stone-800">
                  {formatNumber(stats.segmentCount)}
                </span>
              </div>

              {/* Leaf count - number of leaf instances */}
              <div className="flex justify-between text-stone-600">
                <span>Leaves:</span>
                <span className="font-mono text-stone-800">
                  {formatNumber(stats.leafCount)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No tree generated</p>
          )}
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ACTION BUTTONS
          Fixed at the bottom of the panel
      ───────────────────────────────────────────────────────────── */}
      <footer className="px-4 py-4 border-t border-stone-200 bg-white space-y-3">
        {/* Primary action buttons: Regenerate and Randomize */}
        <div className="flex gap-2">
          {/* Regenerate button - rebuilds tree with current parameters */}
          <button
            type="button"
            onClick={onRegenerate}
            className="
              flex-1 flex items-center justify-center gap-2
              px-3 py-2
              bg-amber-600 hover:bg-amber-700
              text-white text-sm font-medium
              rounded-md
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
            "
            aria-label="Regenerate tree"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Regenerate
          </button>

          {/* Randomize button - generates a new random seed */}
          <button
            type="button"
            onClick={onRandomizeSeed}
            className="
              flex items-center justify-center gap-2
              px-3 py-2
              bg-stone-200 hover:bg-stone-300
              text-stone-700 text-sm font-medium
              rounded-md
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2
            "
            aria-label="Randomize seed"
            title="Randomize seed"
          >
            <Shuffle className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Export dropdown button */}
        <ExportButton
          onExportGLB={onExportGLB}
          onExportGLTF={onExportGLTF}
          onCopyConfig={onCopyConfig}
        />
      </footer>
    </aside>
  )
}
