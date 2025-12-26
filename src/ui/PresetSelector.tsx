/**
 * PresetSelector.tsx
 * A styled dropdown component for selecting tree presets.
 * Uses native <select> with custom Tailwind styling for a warm beige aesthetic.
 */

import { ChevronDown } from 'lucide-react'

/**
 * Props for the PresetSelector component
 */
interface PresetSelectorProps {
  /** Currently selected preset name */
  value: string
  /** Available preset names to choose from */
  options: string[]
  /** Callback fired when the selection changes */
  onChange: (preset: string) => void
}

/**
 * A styled preset selector dropdown.
 * Displays available tree presets in a custom-styled native select element.
 *
 * @example
 * ```tsx
 * <PresetSelector
 *   value="Oak"
 *   options={["Oak", "Pine", "Willow"]}
 *   onChange={(preset) => console.log(preset)}
 * />
 * ```
 */
export function PresetSelector({
  value,
  options,
  onChange,
}: PresetSelectorProps) {
  /**
   * Handle selection change event
   * Extracts the new value and passes it to the onChange callback
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange(event.target.value)
  }

  return (
    <div className="relative">
      {/* Label for accessibility and context */}
      <label className="block text-xs font-medium text-stone-600 mb-1">
        Tree Preset
      </label>

      {/* Container for select and custom dropdown icon */}
      <div className="relative">
        {/* Native select element with custom styling */}
        <select
          value={value}
          onChange={handleChange}
          className="
            w-full
            appearance-none
            bg-stone-100
            border border-stone-300
            text-stone-700 text-sm
            py-2 pl-3 pr-10
            rounded-lg
            shadow-sm
            cursor-pointer
            transition-colors duration-200
            hover:bg-stone-200
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
          "
          aria-label="Select tree preset"
        >
          {/* Map through available options to create option elements */}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow icon - positioned absolutely over the select */}
        <div
          className="
          absolute right-3 top-1/2 -translate-y-1/2
          pointer-events-none
          text-stone-500
        "
        >
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
