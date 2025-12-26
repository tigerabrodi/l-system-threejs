/**
 * ColorPicker.tsx
 * A styled color picker component using the native HTML color input.
 * Provides a labeled color selection interface that fits the warm beige theme.
 */

/**
 * Props for the ColorPicker component
 */
interface ColorPickerProps {
  /** Label displayed above the color picker */
  label: string
  /** Current color value as a hex string (e.g., "#8B4513") */
  value: string
  /** Callback fired when the color changes */
  onChange: (color: string) => void
}

/**
 * A labeled color picker using the native color input.
 * Styled to match the warm beige UI theme.
 *
 * @example
 * ```tsx
 * <ColorPicker
 *   label="Trunk Color"
 *   value="#8B4513"
 *   onChange={(color) => setTrunkColor(color)}
 * />
 * ```
 */
export function ColorPicker({
  label,
  value,
  onChange,
}: ColorPickerProps) {
  /**
   * Handle color input change event
   * Extracts the hex color value and passes it to the onChange callback
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Color input wrapper - provides custom styling around native input */}
      <div className="relative">
        {/* Native color input - styled to be a clean square */}
        <input
          type="color"
          value={value}
          onChange={handleChange}
          className="
            w-10 h-10
            p-1
            bg-stone-100
            border border-stone-300
            rounded-lg
            cursor-pointer
            shadow-sm
            transition-all duration-200
            hover:border-amber-500
            focus:outline-none focus:ring-2 focus:ring-amber-500
          "
          aria-label={`Select ${label} color`}
        />
      </div>

      {/* Label and hex value display */}
      <div className="flex flex-col">
        {/* Primary label */}
        <span className="text-sm font-medium text-stone-700">
          {label}
        </span>

        {/* Current hex value shown as secondary text */}
        <span className="text-xs text-stone-500 font-mono uppercase">
          {value}
        </span>
      </div>
    </div>
  )
}
