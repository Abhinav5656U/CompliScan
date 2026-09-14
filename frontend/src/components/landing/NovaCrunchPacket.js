import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import PacketGeometry from './PacketGeometry';
import PacketMaterials from './PacketMaterials';

export default function NovaCrunchPacket({ 
  frontTexture = '/assets/packaging/nova-crunch-front-texture.png', 
  backTexture = '/assets/packaging/nova-crunch-back-texture.png' 
}) {
  const meshRef = useRef();
  const scroll = useScroll();

  useFrame(() => {
    if (!meshRef.current || !scroll) return;

    // scroll.offset goes from 0 to 1 as the user scrolls
    const offset = scroll.offset;

    // Sequence 1: Camera approach (we move packet closer)
    // Between 10% (0.1) and 45% (0.45)
    const approachProgress = THREE.MathUtils.clamp((offset - 0.1) / 0.35, 0, 1);
    // Move closer by up to 1.5 units on Z
    meshRef.current.position.z = approachProgress * 1.5;

    // Sequence 2: Rotation
    // Between 20% (0.2) and 40% (0.4)
    const rotationProgress = THREE.MathUtils.clamp((offset - 0.2) / 0.2, 0, 1);
    // Rotate exactly 180 degrees (Math.PI)
    meshRef.current.rotation.y = rotationProgress * Math.PI;
  });

  return (
    <mesh ref={meshRef}>
      <PacketGeometry />
      <PacketMaterials frontTexture={frontTexture} backTexture={backTexture} />
    </mesh>
  );
}
