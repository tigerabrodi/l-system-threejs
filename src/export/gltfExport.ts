/**
 * GLTF Export Module
 *
 * Provides utilities for exporting Three.js tree objects to GLTF/GLB format.
 * Supports both binary (.glb) and JSON (.gltf) export formats.
 *
 * Features:
 * - Export tree groups to downloadable files
 * - Support for both binary (GLB) and JSON (GLTF) formats
 * - Copy tree configuration to clipboard for sharing
 */

import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

/**
 * Export options for GLTF/GLB export.
 * Controls the output format and included data.
 */
export interface ExportOptions {
  /** Export as binary (.glb) when true, or JSON (.gltf) when false */
  binary: boolean
  /** Include animations in export (not used currently, reserved for future use) */
  includeAnimations?: boolean
}

/**
 * Parameters for the exportToGLTF function.
 */
export interface ExportToGLTFParams {
  /** The Three.js object to export (can be Scene, Group, Mesh, etc.) */
  object: THREE.Object3D
  /** Export options controlling format and content */
  options: ExportOptions
}

/**
 * Export a Three.js scene/group to GLTF/GLB format.
 *
 * Wraps the callback-based GLTFExporter in a Promise for easier async usage.
 * The result is returned as a Blob that can be downloaded or further processed.
 *
 * @param params - Object containing the Three.js object and export options
 * @returns Promise resolving to a Blob containing the exported data
 *
 * @example
 * ```typescript
 * const blob = await exportToGLTF({
 *   object: treeGroup,
 *   options: { binary: true }
 * })
 * // blob is now a GLB file that can be downloaded
 * ```
 */
export function exportToGLTF(params: ExportToGLTFParams): Promise<Blob> {
  const { object, options } = params

  return new Promise((resolve, reject) => {
    // Create a new GLTFExporter instance
    const exporter = new GLTFExporter()

    // Configure exporter options
    // The exporter accepts additional options beyond just binary format
    const exporterOptions = {
      binary: options.binary,
      // Include all object types (meshes, lights, cameras if present)
      onlyVisible: true,
      // Include custom buffer views for more efficient binary packing
      forceIndices: true,
    }

    // Parse the object and generate GLTF data
    // The exporter uses a callback pattern, so we wrap it in a Promise
    exporter.parse(
      object,
      (result) => {
        // Success callback - create appropriate Blob based on format
        if (options.binary) {
          // Binary format: result is an ArrayBuffer
          // Use model/gltf-binary MIME type for GLB files
          const blob = new Blob([result as ArrayBuffer], {
            type: 'model/gltf-binary',
          })
          resolve(blob)
        } else {
          // JSON format: result is a JavaScript object
          // Stringify and use model/gltf+json MIME type for GLTF files
          const jsonString = JSON.stringify(result, null, 2)
          const blob = new Blob([jsonString], {
            type: 'model/gltf+json',
          })
          resolve(blob)
        }
      },
      (error) => {
        // Error callback - reject the Promise with the error
        reject(error)
      },
      exporterOptions
    )
  })
}

/**
 * Parameters for the downloadBlob function.
 */
export interface DownloadBlobParams {
  /** The Blob to download */
  blob: Blob
  /** The filename for the downloaded file (including extension) */
  filename: string
}

/**
 * Trigger browser download of a blob.
 *
 * Creates a temporary anchor element to initiate a download of the blob.
 * This is a standard browser technique for downloading generated content.
 *
 * @param params - Object containing the blob and desired filename
 *
 * @example
 * ```typescript
 * const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
 * downloadBlob({ blob, filename: 'hello.txt' })
 * // Browser will download a file named 'hello.txt'
 * ```
 */
export function downloadBlob(params: DownloadBlobParams): void {
  const { blob, filename } = params

  // Create a temporary URL for the blob
  // This URL is only valid for the current document session
  const url = URL.createObjectURL(blob)

  // Create a temporary anchor element to trigger the download
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename

  // Append to body (required for Firefox)
  document.body.appendChild(anchor)

  // Programmatically click the anchor to trigger download
  anchor.click()

  // Clean up: remove the anchor and revoke the blob URL
  // Revoking the URL is important to free memory
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Parameters for the downloadTreeAsGLB function.
 */
export interface DownloadTreeAsGLBParams {
  /** The tree group to export */
  treeGroup: THREE.Group
  /** Optional custom filename (defaults to 'tree.glb') */
  filename?: string
}

/**
 * Export and download a tree as GLB (binary GLTF).
 *
 * Convenience function that combines export and download for GLB format.
 * GLB is preferred for most use cases as it's a single file with all data
 * embedded, making it easier to share and load.
 *
 * @param params - Object containing the tree group and optional filename
 * @returns Promise that resolves when download is initiated
 *
 * @example
 * ```typescript
 * // Download with default filename
 * await downloadTreeAsGLB({ treeGroup: myTree })
 *
 * // Download with custom filename
 * await downloadTreeAsGLB({
 *   treeGroup: myTree,
 *   filename: 'oak-tree.glb'
 * })
 * ```
 */
export async function downloadTreeAsGLB(
  params: DownloadTreeAsGLBParams
): Promise<void> {
  const { treeGroup, filename = 'tree.glb' } = params

  // Export the tree group to GLB format
  const blob = await exportToGLTF({
    object: treeGroup,
    options: { binary: true },
  })

  // Trigger the browser download
  downloadBlob({ blob, filename })
}

/**
 * Parameters for the downloadTreeAsGLTF function.
 */
export interface DownloadTreeAsGLTFParams {
  /** The tree group to export */
  treeGroup: THREE.Group
  /** Optional custom filename (defaults to 'tree.gltf') */
  filename?: string
}

/**
 * Export and download a tree as GLTF (JSON format).
 *
 * Convenience function that combines export and download for GLTF format.
 * GLTF JSON format is human-readable and useful for debugging or when
 * you need to inspect the exported data structure.
 *
 * Note: GLTF JSON format may reference external files (textures, buffers).
 * For a self-contained file, use GLB format instead.
 *
 * @param params - Object containing the tree group and optional filename
 * @returns Promise that resolves when download is initiated
 *
 * @example
 * ```typescript
 * // Download with default filename
 * await downloadTreeAsGLTF({ treeGroup: myTree })
 *
 * // Download with custom filename
 * await downloadTreeAsGLTF({
 *   treeGroup: myTree,
 *   filename: 'pine-tree.gltf'
 * })
 * ```
 */
export async function downloadTreeAsGLTF(
  params: DownloadTreeAsGLTFParams
): Promise<void> {
  const { treeGroup, filename = 'tree.gltf' } = params

  // Export the tree group to GLTF JSON format
  const blob = await exportToGLTF({
    object: treeGroup,
    options: { binary: false },
  })

  // Trigger the browser download
  downloadBlob({ blob, filename })
}

/**
 * Parameters for the copyConfigToClipboard function.
 */
export interface CopyConfigToClipboardParams {
  /** The configuration object to copy (will be JSON stringified) */
  config: Record<string, unknown>
}

/**
 * Copy tree configuration as JSON to clipboard.
 *
 * Useful for sharing tree configurations or saving them for later use.
 * The configuration is formatted with indentation for readability.
 *
 * @param params - Object containing the configuration to copy
 * @returns Promise that resolves when copy is complete
 * @throws Error if clipboard access is denied
 *
 * @example
 * ```typescript
 * import { defaultTreeConfig } from '../tree/TreeBuilder'
 *
 * const config = defaultTreeConfig()
 * await copyConfigToClipboard({ config })
 * // Configuration is now in clipboard, ready to paste
 * ```
 */
export async function copyConfigToClipboard(
  params: CopyConfigToClipboardParams
): Promise<void> {
  const { config } = params

  // Convert configuration to formatted JSON string
  // Using 2-space indentation for readability
  const jsonString = JSON.stringify(config, null, 2)

  // Use the Clipboard API to copy the string
  // This requires user gesture and secure context (HTTPS)
  await navigator.clipboard.writeText(jsonString)
}
