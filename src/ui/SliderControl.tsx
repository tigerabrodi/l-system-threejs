import { useCallback } from 'react'
import type { ChangeEvent } from 'react'

/**
 * Props interface for the SliderControl component.
 * Defines all configuration options for the slider input.
 */
interface SliderControlProps {
  /** Label displayed above the slider */
  label: string
  /** Current value */
  value: number
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Step increment */
  step: number
  /** Called when value changes */
  onChange: (value: number) => void
  /** Optional: show current value display */
  showValue?: boolean
  /** Optional: format function for displayed value */
  formatValue?: (value: number) => string
}

/**
 * Default formatter that converts the numeric value to a string.
 * Used when no custom formatValue function is provided.
 */
const defaultFormatValue = (value: number): string => String(value)

/**
 * SliderControl - A reusable slider input component with warm beige styling.
 *
 * Features:
 * - Customizable min, max, and step values
 * - Optional value display with custom formatting
 * - Warm stone/beige color palette using Tailwind CSS
 * - Accessible label association
 *
 * @example
 * ```tsx
 * <SliderControl
 *   label="Volume"
 *   value={volume}
 *   min={0}
 *   max={100}
 *   step={1}
 *   onChange={setVolume}
 *   showValue
 *   formatValue={(v) => `${v}%`}
 * />
 * ```
 */
export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  showValue = false,
  formatValue = defaultFormatValue,
}: SliderControlProps) {
  /**
   * Handle changes to the range input.
   * Parses the string value from the event and calls onChange with the numeric value.
   */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const newValue = parseFloat(event.target.value)
      onChange(newValue)
    },
    [onChange]
  )

  // Format the current value for display using the provided or default formatter
  const formattedValue = formatValue(value)

  return (
    <div className="flex flex-col gap-1">
      {/* Label text displayed above the slider */}
      <label className="text-xs text-stone-600 font-medium">{label}</label>

      {/* Container for the slider and optional value display */}
      <div className="flex items-center gap-2">
        {/* Native range input with warm accent styling */}
        <input
          type="range"
          className="flex-1 accent-amber-700 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          aria-label={label}
        />

        {/* Conditional value display on the right side */}
        {showValue && (
          <span className="text-xs text-stone-500 w-12 text-right tabular-nums">
            {formattedValue}
          </span>
        )}
      </div>
    </div>
  )
}
