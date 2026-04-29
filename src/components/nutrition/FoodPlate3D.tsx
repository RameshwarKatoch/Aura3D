import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Float, RoundedBox } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface Props {
  proteinSource: string;
  isVeg: boolean;
}

function ProteinSource({ type, isVeg }: { type: string; isVeg: boolean }) {
  // Map protein source string to a stylized 3D shape
  const color = isVeg ? '#10b981' : '#ef4444';
  
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      {type.toLowerCase().includes('paneer') || type.toLowerCase().includes('tofu') ? (
        <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} />
        </RoundedBox>
      ) : type.toLowerCase().includes('chicken') || type.toLowerCase().includes('turkey') ? (
        <mesh>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
        </mesh>
      ) : (
        <mesh>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      )}
    </Float>
  );
}

export default function FoodPlate3D({ proteinSource, isVeg }: Props) {
  return (
    <div className="w-full h-full min-h-[300px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} shadows={{ type: 'contact', opacity: 0.4, blur: 2 }}>
            {/* The Plate */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
              <circleGeometry args={[2, 64]} />
              <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
              <ringGeometry args={[1.9, 2, 64]} />
              <meshStandardMaterial color="#f3f4f6" />
            </mesh>

            {/* The Protein Highlight */}
            <ProteinSource type={proteinSource} isVeg={isVeg} />
            
            {/* Decorative Side items (simplified) */}
            <mesh position={[-1.2, 0.2, 0.5]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color="#4ade80" />
            </mesh>
            <mesh position={[1, 0.2, -0.8]}>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#fbbf24" />
            </mesh>
          </Stage>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full backdrop-blur-md border border-primary/20">
          Source: {proteinSource}
        </p>
      </div>
    </div>
  );
}
