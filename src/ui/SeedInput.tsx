/**
 * SeedInput.tsx
 * A text input component for entering seed values with a randomize button.
 * Seeds are used for reproducible procedural generation.
 */

import { Shuffle } from 'lucide-react'

/**
 * Props for the SeedInput component
 */
interface SeedInputProps {
  /** Current seed value displayed in the input */
  value: string
  /** Callback fired when the seed value changes */
  onChange: (seed: string) => void
  /** Callback fired when the randomize button is clicked */
  onRandomize: () => void
}

/**
 * A seed input field with an attached randomize button.
 * Allows users to enter a specific seed or generate a random one.
 *
 * @example
 * ```tsx
 * <SeedInput
 *   value="abc123"
 *   onChange={(seed) => setSeed(seed)}
 *   onRandomize={() => setSeed(generateRandomSeed())}
 * />
 * ```
 */
export function SeedInput({
  value,
  onChange,
  onRandomize,
}: SeedInputProps) {
  /**
   * Handle input change event
   * Extracts the new value and passes it to the onChange callback
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value)
  }

  /**
   * Handle randomize button click
   * Triggers the onRandomize callback to generate a new seed
   */
  const handleRandomize = (): void => {
    onRandomize()
  }

  return (
    <div>
      {/* Label for accessibility and context */}
      <label className="block text-xs font-medium text-stone-600 mb-1">
        Seed
      </label>

      {/* Input group: text input + randomize button */}
      <div className="flex items-center gap-2">
        {/* Seed text input */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Enter seed..."
          className="
            flex-1
            bg-stone-100
            border border-stone-300
            text-stone-700 text-sm
            py-2 px-3
            rounded-lg
            shadow-sm
            transition-colors duration-200
            placeholder:text-stone-400
            hover:bg-stone-200
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
          "
          aria-label="Seed value"
        />

        {/* Randomize button with shuffle icon */}
        <button
          type="button"
          onClick={handleRandomize}
          className="
            flex items-center justify-center
            w-10 h-10
            bg-amber-600
            text-white
            rounded-lg
            shadow-sm
            transition-colors duration-200
            hover:bg-amber-700
            active:bg-amber-800
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          "
          aria-label="Generate random seed"
          title="Generate random seed"
        >
          <Shuffle size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-1 text-xs text-stone-500">
        Same seed produces the same tree
      </p>
    </div>
  )
}
