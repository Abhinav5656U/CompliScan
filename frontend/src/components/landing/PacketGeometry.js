import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function PacketGeometry() {
  const geometry = useMemo(() => {
    // 1.5 width, 2.2 height, 0.05 base depth, enough segments for smooth curve
    const geo = new THREE.BoxGeometry(1.5, 2.2, 0.05, 32, 32, 2);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      
      const nx = v.x / 0.75; // Normalized x from -1 to 1
      const ny = v.y / 1.1;  // Normalized y from -1 to 1
      
      // Calculate puff amount (highest in center, 0 at edges)
      const puffX = Math.cos(nx * Math.PI / 2);
      const puffY = Math.cos(ny * Math.PI / 2);
      const puff = puffX * puffY;
      
      // Inflate Z for front and back faces. Make the base thickness paper-thin at the edges to simulate a sealed pouch.
      if (Math.abs(v.z) > 0.01) {
        v.z = Math.sign(v.z) * (0.002 + 0.18 * puff);
      }
      
      // Pull in X slightly at the middle to simulate tension from inflation
      v.x -= Math.sign(v.x) * (puff * 0.05);
      
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return <primitive object={geometry} attach="geometry" />;
}
