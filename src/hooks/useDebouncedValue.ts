import { useState, useEffect } from 'react'

/**
 * Parameters for the useDebouncedValue hook.
 */
export interface UseDebouncedValueParams<T> {
  /** The value to debounce */
  value: T
  /** Delay in milliseconds before the value updates */
  delay: number
}

/**
 * Hook that debounces a value.
 * Returns the debounced value that only updates after the delay has passed
 * without the input value changing.
 *
 * This is useful for preventing expensive operations (like API calls or
 * complex calculations) from running on every keystroke or rapid state change.
 *
 * @param params - Object containing the value and delay
 * @param params.value - The value to debounce
 * @param params.delay - Delay in milliseconds before updating the debounced value
 * @returns The debounced value that updates after the specified delay
 *
 * @example
 * ```typescript
 * // Debounce a search input
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebouncedValue({
 *   value: searchTerm,
 *   delay: 300
 * })
 *
 * // Use debouncedSearch for API calls
 * useEffect(() => {
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */
export function useDebouncedValue<T>(params: UseDebouncedValueParams<T>): T {
  const { value, delay } = params

  // Store the debounced value in state
  // Initially set to the input value
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup function: clear the timeout if the value changes
    // before the delay has elapsed, or if the component unmounts
    return () => {
      clearTimeout(timeoutId)
    }
  }, [value, delay]) // Re-run effect when value or delay changes

  return debouncedValue
}
