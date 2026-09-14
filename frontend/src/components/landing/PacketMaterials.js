import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export default function PacketMaterials({ frontTexture, backTexture }) {
  // Load textures using Drei's useTexture
  const frontTex = useTexture(frontTexture);
  const backTex = useTexture(backTexture);

  const materials = useMemo(() => {
    // Ensure correct color space for the loaded textures
    frontTex.colorSpace = THREE.SRGBColorSpace;
    backTex.colorSpace = THREE.SRGBColorSpace;
    
    // Fix back face mirroring on BoxGeometry
    const backTexFixed = backTex.clone();
    backTexFixed.wrapS = THREE.RepeatWrapping;
    backTexFixed.repeat.x = -1;
    backTexFixed.needsUpdate = true;

    // Zero metalness, 0.4 roughness for non-metallic laminated plastic
    const roughness = 0.4;
    const metalness = 0;
    
    // Side material: completely hidden so the rectangular bounding box doesn't show
    const sideMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xeaeaea, 
      roughness, 
      metalness,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness,
      metalness,
      transparent: true,
      alphaTest: 0.5
    });
    
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexFixed,
      roughness,
      metalness,
      transparent: true,
      alphaTest: 0.5
    });
    
    // BoxGeometry material array order: Right, Left, Top, Bottom, Front, Back
    return [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      frontMaterial,
      backMaterial
    ];
  }, [frontTex, backTex]);

  return materials.map((mat, index) => (
    <primitive key={index} object={mat} attach={`material-${index}`} />
  ));
}
