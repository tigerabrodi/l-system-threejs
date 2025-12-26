/// <reference types="vite/client" />

/**
 * Type declarations for importing image assets.
 * Vite handles these imports and returns URL strings.
 */
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
