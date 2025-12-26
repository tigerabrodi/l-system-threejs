# Procedural Tree Generator

A browser-based tool for generating realistic 3D procedural trees using L-systems. Built with React, Three.js, and TypeScript.

## Features

- **L-System Engine** - Parametric grammar-based tree generation with stochastic rules
- **5 Tree Presets** - Oak, Pine, Willow, Bush, and Simple configurations
- **Real-time Customization** - Adjust iterations, branch angles, leaf size/color, and more
- **Wind Animation** - Vertex shader-based wind simulation for branches and leaves
- **Export Options** - Download trees as GLTF or GLB, copy config to clipboard
- **Deterministic Seeds** - Same seed always produces the same tree

## Tech Stack

- **React 19** + **TypeScript**
- **Three.js** + **React Three Fiber** for 3D rendering
- **Tailwind CSS** for styling
- **Vite** for bundling
- **Vitest** for testing
- **Bun** as runtime/package manager

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun test

# Type check
bun tsc

# Lint
bun lint

# Build for production
bun run build
```

## Project Structure

```
src/
├── lsystem/           # L-system engine
│   ├── engine.ts      # Rule application and sentence generation
│   ├── random.ts      # Seeded PRNG (xmur3 + sfc32)
│   ├── presets.ts     # Tree preset configurations
│   └── symbols.ts     # Symbol type definitions
├── tree/              # Tree geometry generation
│   ├── turtle3d.ts    # 3D turtle interpreter
│   ├── branchGeometry.ts  # Cylindrical branch mesh builder
│   ├── leafGeometry.ts    # Instanced leaf geometry
│   ├── materials.ts   # Bark and leaf materials
│   ├── skeleton.ts    # Type definitions
│   └── TreeBuilder.ts # Main orchestrator
├── scene/             # Three.js scene setup
│   ├── SceneSetup.tsx # Canvas, camera, controls
│   ├── lighting.ts    # Sun and ambient lights
│   ├── ground.ts      # Ground plane
│   ├── camera.ts      # Camera configuration
│   └── wind.ts        # Wind shader system
├── ui/                # React UI components
│   ├── ControlPanel.tsx   # Main sidebar
│   ├── SliderControl.tsx  # Reusable slider
│   ├── PresetSelector.tsx # Preset dropdown
│   └── ...
├── hooks/             # React hooks
│   ├── useTreeGenerator.ts    # Tree state management
│   └── useDebouncedValue.ts   # Debounce hook
├── utils/             # Math utilities
│   ├── math.ts        # Vector operations
│   └── quaternion.ts  # Quaternion math
└── export/            # Export functionality
    └── gltfExport.ts  # GLTF/GLB export
```

## How It Works

1. **L-System Expansion** - Starting from an axiom, rules are applied iteratively to produce a string of symbols
2. **Turtle Interpretation** - A 3D turtle walks through the symbol string, building a skeleton of nodes and segments
3. **Geometry Generation** - Branch cylinders and leaf quads are generated from the skeleton
4. **Rendering** - Three.js renders the geometry with PBR materials and wind animation

## Testing

The core modules have comprehensive test coverage:

```bash
bun test              # Run all tests
bun test --watch      # Watch mode
```

92 tests covering:

- Seeded random number generation
- L-system rule application
- Vector and quaternion math
- Turtle interpretation
- Branch and leaf geometry generation
- UV mapping

## License

MIT
