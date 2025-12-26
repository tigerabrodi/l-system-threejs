import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

/**
 * A simple spinning cube component to verify Three.js is working.
 * This will be replaced with the actual tree viewer once we build it.
 */
function SpinningCube() {
  const meshRef = useRef<Mesh>(null)

  // Rotate the cube every frame
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.7
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8B7355" />
    </mesh>
  )
}

/**
 * Root application component.
 * Sets up the Three.js canvas with basic lighting and controls.
 */
function App() {
  return (
    <div className="w-screen h-screen bg-stone-100">
      <Canvas
        camera={{
          position: [3, 3, 3],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{ antialias: true }}
      >
        {/* Warm ambient lighting for that cozy feel */}
        <ambientLight intensity={0.4} color="#FFF8E7" />

        {/* Main directional light - simulates late afternoon sun */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          color="#FFFAF0"
          castShadow
        />

        {/* Fill light from below to soften shadows */}
        <hemisphereLight
          color="#87CEEB"
          groundColor="#8B7355"
          intensity={0.3}
        />

        {/* The spinning cube - proof Three.js is working */}
        <SpinningCube />

        {/* Orbit controls for camera manipulation */}
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={50}
        />
      </Canvas>
    </div>
  )
}

export default App
