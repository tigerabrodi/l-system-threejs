/**
 * ExportButton.tsx
 * A dropdown button component for exporting the tree in various formats.
 * Provides options for GLB, GLTF export and copying configuration.
 */

import { ChevronDown, Copy, Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Props for the ExportButton component
 */
interface ExportButtonProps {
  /** Callback fired when GLB export is clicked */
  onExportGLB: () => void
  /** Callback fired when GLTF export is clicked */
  onExportGLTF: () => void
  /** Callback fired when copy config is clicked */
  onCopyConfig: () => void
  /** Whether an export operation is currently in progress */
  isExporting?: boolean
}

/**
 * A dropdown button for export options.
 * Shows a main button that opens a dropdown menu with export formats.
 *
 * @example
 * ```tsx
 * <ExportButton
 *   onExportGLB={() => exportToGLB()}
 *   onExportGLTF={() => exportToGLTF()}
 *   onCopyConfig={() => copyConfigToClipboard()}
 *   isExporting={isLoading}
 * />
 * ```
 */
export function ExportButton({
  onExportGLB,
  onExportGLTF,
  onCopyConfig,
  isExporting = false,
}: ExportButtonProps) {
  // Track whether the dropdown menu is open
  const [isOpen, setIsOpen] = useState(false)

  // Ref for the dropdown container to handle outside clicks
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * Close dropdown when clicking outside
   * Uses event listener on document to detect clicks outside the component
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // Add listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup listener on unmount or when dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /**
   * Toggle dropdown visibility
   */
  const toggleDropdown = (): void => {
    if (!isExporting) {
      setIsOpen((prev) => !prev)
    }
  }

  /**
   * Handle menu item click
   * Executes the action and closes the dropdown
   */
  const handleMenuItemClick = (action: () => void): void => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main export button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={isExporting}
        className={`
          flex items-center justify-center gap-2
          w-full
          py-2 px-4
          text-sm font-medium
          rounded-lg
          shadow-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          ${
            isExporting
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
              : 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Export options"
      >
        <Download size={16} aria-hidden="true" />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown
          size={14}
          className={`
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown menu - positioned absolutely below the button */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0
            mt-1
            bg-stone-100
            border border-stone-300
            rounded-lg
            shadow-lg
            overflow-hidden
            z-10
          "
          role="menu"
          aria-orientation="vertical"
        >
          {/* Export as GLB option */}
          <button
            type="button"
            onClick={() => handleMenuItemClick(onExportGLB)}
            className="
              flex items-center gap-2
              w-full
              py-2 px-3
              text-sm text-stone-700
              text-left
              transition-colors duration-150
              hover:bg-stone-200
              focus:outline-none focus:bg-stone-200
            "
            role="menuitem"
          >
            <Download size={14} className="text-amber-600" aria-hidden="true" />
            <span>Export as GLB</span>
          </button>

          {/* Export as GLTF option */}
          <button
            type="button"
            onClick={() => handleMenuItemClick(onExportGLTF)}
            className="
              flex items-center gap-2
              w-full
              py-2 px-3
              text-sm text-stone-700
              text-left
              transition-colors duration-150
              hover:bg-stone-200
              focus:outline-none focus:bg-stone-200
            "
            role="menuitem"
          >
            <Download size={14} className="text-amber-600" aria-hidden="true" />
            <span>Export as GLTF</span>
          </button>

          {/* Divider */}
          <div className="border-t border-stone-300" />

          {/* Copy config option */}
          <button
            type="button"
            onClick={() => handleMenuItemClick(onCopyConfig)}
            className="
              flex items-center gap-2
              w-full
              py-2 px-3
              text-sm text-stone-700
              text-left
              transition-colors duration-150
              hover:bg-stone-200
              focus:outline-none focus:bg-stone-200
            "
            role="menuitem"
          >
            <Copy size={14} className="text-amber-600" aria-hidden="true" />
            <span>Copy Config</span>
          </button>
        </div>
      )}
    </div>
  )
}
