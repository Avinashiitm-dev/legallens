import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

const SHAPE_SPHERE = 0;
const SHAPE_DIAMOND = 1;
const SHAPE_CUBE = 2;
const SHAPE_TORUS = 3;
const NUM_SHAPES = 4;

function MorphingMesh() {
  // High detail icosahedron (close to a perfect sphere)
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, 64), []);

  // Store original positions (Sphere)
  const originalPositions = useMemo(() => {
    return new Float32Array(geometry.attributes.position.array);
  }, [geometry]);

  // Pre-calculate target positions for performance
  const diamondPositions = useMemo(() => new Float32Array(originalPositions.length), [originalPositions]);
  const cubePositions = useMemo(() => new Float32Array(originalPositions.length), [originalPositions]);
  const torusPositions = useMemo(() => new Float32Array(originalPositions.length), [originalPositions]);

  useMemo(() => {
    const v = new THREE.Vector3();
    const radius = 2;
    for (let i = 0; i < originalPositions.length; i += 3) {
      v.set(originalPositions[i], originalPositions[i + 1], originalPositions[i + 2]);
      
      // Diamond (Octahedron) - L1 norm
      const l1 = Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z);
      const diamondScale = radius / l1;
      diamondPositions[i] = v.x * diamondScale;
      diamondPositions[i + 1] = v.y * diamondScale;
      diamondPositions[i + 2] = v.z * diamondScale;

      // Cube - L-infinity norm
      const lInf = Math.max(Math.abs(v.x), Math.max(Math.abs(v.y), Math.abs(v.z)));
      const cubeScale = radius / lInf;
      // Interpolate slightly with sphere so it's a rounded cube
      cubePositions[i] = THREE.MathUtils.lerp(v.x, v.x * cubeScale, 0.85);
      cubePositions[i + 1] = THREE.MathUtils.lerp(v.y, v.y * cubeScale, 0.85);
      cubePositions[i + 2] = THREE.MathUtils.lerp(v.z, v.z * cubeScale, 0.85);

      // Torus Knot / Torus approximation
      const u = Math.atan2(v.z, v.x);
      const vAngle = Math.asin(v.y / radius);
      
      const R = 1.4; // Major radius
      const r = 0.6; // Minor radius
      
      torusPositions[i] = (R + r * Math.cos(vAngle * 2)) * Math.cos(u);
      torusPositions[i + 1] = r * Math.sin(vAngle * 2);
      torusPositions[i + 2] = (R + r * Math.cos(vAngle * 2)) * Math.sin(u);
    }
  }, [originalPositions, diamondPositions, cubePositions, torusPositions]);

  // Animation state
  const state = useRef({
    currentShape: SHAPE_DIAMOND,
    nextShape: SHAPE_SPHERE,
    progress: 0,
    lastChange: 0,
    duration: 3, // Morph duration in seconds
    pause: 3, // Pause duration between morphs
  });

  useFrame((stateParams) => {
    const time = stateParams.clock.getElapsedTime();
    const s = state.current;
    
    // Logic to switch shapes
    if (time - s.lastChange > s.duration + s.pause) {
      s.currentShape = s.nextShape;
      s.nextShape = (s.nextShape + 1) % NUM_SHAPES;
      s.lastChange = time;
      s.progress = 0;
    }

    if (time - s.lastChange < s.duration) {
      // Ease in-out cubic function for smooth morphing
      const t = (time - s.lastChange) / s.duration;
      s.progress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    } else {
      s.progress = 1;
    }

    const currentArray = 
      s.currentShape === SHAPE_SPHERE ? originalPositions :
      s.currentShape === SHAPE_DIAMOND ? diamondPositions :
      s.currentShape === SHAPE_CUBE ? cubePositions :
      torusPositions;
      
    const nextArray = 
      s.nextShape === SHAPE_SPHERE ? originalPositions :
      s.nextShape === SHAPE_DIAMOND ? diamondPositions :
      s.nextShape === SHAPE_CUBE ? cubePositions :
      torusPositions;

    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = THREE.MathUtils.lerp(currentArray[i], nextArray[i], s.progress);
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh geometry={geometry}>
        {/* Glassmorphic / Metallic material */}
        <MeshTransmissionMaterial 
          backside
          backsideThickness={1}
          thickness={0.5}
          chromaticAberration={0.05}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.2}
          roughness={0.1}
          metalness={0.3}
          color="#a3b8cc"
          transmission={0.9}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      // Interactive parallax tilt based on mouse position
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, (state.pointer.x * Math.PI) / 10, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, (-state.pointer.y * Math.PI) / 10, 0.05);
      
      // Ambient slow rotation
      group.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={group}>
      <MorphingMesh />
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#4338ca" />
      <pointLight position={[10, -10, 10]} intensity={2} color="#ea580c" />
    </group>
  );
}

export default function MorphingBackground() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-90">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
    </div>
  );
}
