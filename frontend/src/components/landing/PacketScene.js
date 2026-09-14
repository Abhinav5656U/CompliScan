import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, ScrollControls } from '@react-three/drei';
import NovaCrunchPacket from './NovaCrunchPacket';

export default function PacketScene() {
  return (
    <div className="w-full h-full min-h-[400px] sm:min-h-[500px] relative pointer-events-none">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          
          <Environment preset="studio" />
          
          <ScrollControls pages={1.5} damping={0.15} distance={1}>
            <NovaCrunchPacket />
          </ScrollControls>
          
          <ContactShadows 
            position={[0, -1.4, 0]} 
            opacity={0.3} 
            scale={5} 
            blur={2} 
            far={3} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
