import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, ContactShadows, Environment, Float, Html, MeshDistortMaterial, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import type { MuscleReadiness, MuscleGroupName, TrainingMode } from '../../types';

export type MuscleGroup = MuscleGroupName | null;

// ─── Readiness Color Config ─────────────────────────────────────────────────
export const READINESS_CONFIG: Record<MuscleReadiness, {
  color: string;
  emissive: string;
  label: string;
  description: string;
}> = {
  fatigued:   { color: '#FF3131', emissive: '#FF0000', label: 'Fatigued',        description: 'Trained < 24h ago' },
  recovering: { color: '#FF914D', emissive: '#FF5733', label: 'Recovering',      description: 'Trained 24–72h ago' },
  ready:      { color: '#FFBD59', emissive: '#FF914D', label: 'Ready',           description: 'Trained 3–5 days ago' },
  primed:     { color: '#38B6FF', emissive: '#2D5BFF', label: 'Primed',          description: 'Trained 5–7 days ago' },
  fresh:      { color: '#2D5BFF', emissive: '#0047AB', label: 'Fully Recovered', description: 'Not trained this week' },
  unknown:    { color: '#1A1A1A', emissive: '#0D0D0D', label: 'Unknown',         description: 'No data logged' },
};

// ─── Fresnel Shader ─────────────────────────────────────────────────────────
const FresnelShader = {
  uniforms: {
    tCube: { value: null },
    mRefractionRatio: { value: 1.02 },
    mFresnelBias: { value: 0.1 },
    mFresnelPower: { value: 2.0 },
    mFresnelScale: { value: 1.0 },
    color: { value: new THREE.Color('#38B6FF') },
    opacity: { value: 0.5 },
    time: { value: 0 },
    isPower: { value: 0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float opacity;
    uniform float mFresnelBias;
    uniform float mFresnelScale;
    uniform float mFresnelPower;
    uniform float time;
    uniform float isPower;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = mFresnelBias + mFresnelScale * pow(1.0 + dot(-viewDir, normal), mFresnelPower);
      
      vec3 finalColor = color;
      if (isPower > 0.5) {
        float pulse = sin(time * 5.0 + gl_FragCoord.y * 0.1) * 0.5 + 0.5;
        finalColor += vec3(0.0, 0.5, 1.0) * pulse;
      }
      
      gl_FragColor = vec4(finalColor, fresnel * opacity);
    }
  `
};

interface Anatomy3DProps {
  activeMuscle: MuscleGroup;
  onMuscleClick: (muscle: MuscleGroup) => void;
  weightScale: number;
  muscleReadiness?: Record<string, MuscleReadiness>;
  visualMode?: TrainingMode;
  soreness?: Record<string, number>; // 0 to 1
  activeSkin?: string;
  poseLandmarks?: any;
}

// ─── HumanFigure ─────────────────────────────────────────────────────────────
export function HumanFigure({
  onMuscleClick,
  weightScale,
  muscleReadiness = {},
  hovered,
  setHovered,
  definitionScale = 1,
  posture = 0,
  auraColor = null,
  visualMode = 'power',
  soreness = {},
  activeSkin = 'blue',
  poseLandmarks = null
}: {
  onMuscleClick: (m: MuscleGroup) => void;
  weightScale: number;
  muscleReadiness?: Record<string, MuscleReadiness>;
  hovered: MuscleGroup;
  setHovered: (m: MuscleGroup) => void;
  definitionScale?: number;
  posture?: number;
  auraColor?: string | null;
  visualMode?: TrainingMode;
  soreness?: Record<string, number>;
  activeSkin?: string;
  poseLandmarks?: any;
}) {
  const group = useRef<THREE.Group>(null);
  const torsoGroup = useRef<THREE.Group>(null);
  const headGroup = useRef<THREE.Group>(null);
  const fresnelRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (fresnelRef.current) {
      fresnelRef.current.uniforms.time.value = t;
    }
    if (group.current) {
      group.current.scale.lerp(new THREE.Vector3(weightScale, 1, weightScale), 0.1);
    }
    if (torsoGroup.current) {
      // Posture: 0 is neutral, -1 is slumped, 1 is upright
      // Slumped: Rotate torso forward (X positive), Head forward (X positive)
      // Upright: Rotate torso back (X negative), Head back (X negative)
      const torsoRot = (posture < 0 ? 0.2 : posture > 0 ? -0.1 : 0) * Math.abs(posture);
      torsoGroup.current.rotation.x = THREE.MathUtils.lerp(torsoGroup.current.rotation.x, torsoRot, 0.1);
    }
    if (headGroup.current) {
      const headRot = (posture < 0 ? 0.3 : posture > 0 ? -0.15 : 0) * Math.abs(posture);
      headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, headRot, 0.1);
    }
  });

  // ─── Landmark Mapping Logic ────────────────────────────────────────────────
  // Map landmarks to 3D space (normalized)
  const getLandmarkPos = (index: number) => {
    if (!poseLandmarks || !poseLandmarks[index]) return null;
    const lm = poseLandmarks[index];
    // Map MediaPipe (0-1) to Three.js (-2 to 2 roughly)
    // We also flip Y because MediaPipe is top-down
    return new THREE.Vector3(
      (lm.x - 0.5) * 4,
      (0.5 - lm.y) * 6 + 1.5,
      -lm.z * 2
    );
  };

  const getMaterial = (muscle: MuscleGroup) => {
    const isHovered = hovered === muscle;
    const readiness: MuscleReadiness = muscle
      ? (muscleReadiness[muscle] ?? 'unknown')
      : 'unknown';
    const cfg = READINESS_CONFIG[readiness];

    return new THREE.MeshPhysicalMaterial({
      color: isHovered ? '#ffffff' : cfg.color,
      metalness: 0.2,
      roughness: 0.3,
      transmission: isHovered ? 0.35 : 0.1,
      thickness: 1.5,
      emissive: isHovered ? '#ffffff' : cfg.emissive,
      emissiveIntensity: isHovered ? 0.8 : (readiness === 'unknown' ? 0.1 : 0.5),
      transparent: true,
      opacity: 0.95,
    });
  };

  const getSorenessMaterial = (muscle: MuscleGroup) => {
    const level = muscle ? (soreness[muscle] ?? 0) : 0;
    const isHovered = hovered === muscle;
    
    return new THREE.MeshPhysicalMaterial({
      color: isHovered ? '#ffffff' : level > 0 ? '#A78BFA' : '#1f2937',
      emissive: level > 0 ? '#8B5CF6' : '#000000',
      emissiveIntensity: isHovered ? 0.8 : level * 2,
      metalness: 0.5,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
  };

  const currentGetMaterial = visualMode === 'recovery' ? getSorenessMaterial : getMaterial;

  const neutralMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    metalness: 0.1,
    roughness: 0.7,
    transparent: true,
    opacity: 0.4,
  });

  const over = (m: MuscleGroup) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(m);
    document.body.style.cursor = 'pointer';
  };
  const out = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(null);
    document.body.style.cursor = 'default';
  };
  const click = (m: MuscleGroup) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onMuscleClick(m);
  };

  const fresnelMat = new THREE.ShaderMaterial({
    ...FresnelShader,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      ...THREE.UniformsUtils.clone(FresnelShader.uniforms),
      isPower: { value: visualMode === 'power' ? 1 : 0 },
      color: { value: new THREE.Color(activeSkin === 'gold' ? '#FDB913' : visualMode === 'power' ? '#FDB913' : visualMode === 'endurance' ? '#00F0FF' : '#38B6FF') }
    }
  });

  return (
    <group ref={group} position={[0, -2, 0]}>
      {/* ─── 3D Data Ring ─── */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 2.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.8, 0.02, 16, 100]} />
            <meshBasicMaterial color={visualMode === 'power' ? '#FDB913' : '#38B6FF'} transparent opacity={0.3} />
          </mesh>
          <Html position={[1.9, 0, 0]} center>
            <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2 py-0.5 text-[10px] text-white whitespace-nowrap font-mono">
              BMI: 24.2
            </div>
          </Html>
          <Html position={[-1.9, 0, 0]} center>
            <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2 py-0.5 text-[10px] text-white whitespace-nowrap font-mono">
              FAT: 18.5%
            </div>
          </Html>
        </group>
      </Float>

      {/* ─── Aura Sphere ─── */}
      {auraColor && (
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <MeshDistortMaterial
            color={auraColor}
            speed={2}
            distort={0.4}
            transparent
            opacity={0.15}
            emissive={auraColor}
            emissiveIntensity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ─── Skeleton / Core ─── */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
        <meshBasicMaterial color="#2D5BFF" transparent opacity={0.3} />
      </mesh>

      <group ref={torsoGroup}>
        {/* Holographic Shell */}
        <mesh position={[0, 2.5, 0]} scale={[1.1, 1.1, 1.1]}>
          <capsuleGeometry args={[0.8, 4, 16, 32]} />
          <shaderMaterial ref={fresnelRef} attach="material" {...FresnelShader} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* ─── Torso ─── */}
        <mesh position={[0, 3, 0]} material={neutralMat}>
          <capsuleGeometry args={[0.6, 1.8, 16, 32]} />
        </mesh>

        {/* Head */}
        <group ref={headGroup} position={[0, 4.8, 0]}>
          <mesh material={neutralMat}>
            <sphereGeometry args={[0.4, 32, 32]} />
          </mesh>
          <mesh position={[0, 0, 0.2]} material={neutralMat}>
            <boxGeometry args={[0.2, 0.1, 0.1]} />
          </mesh>
        </group>

        {/* ─── Upper Body Muscles ─── */}
        <mesh
          position={[0, 3.8, 0.45]}
          onPointerOver={over('Chest')}
          onPointerOut={out}
          onClick={click('Chest')}
          material={currentGetMaterial('Chest')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <boxGeometry args={[1.1, 0.7, 0.2]} />
        </mesh>

        <mesh
          position={[0, 3.0, 0.4]}
          onPointerOver={over('Abs')}
          onPointerOut={out}
          onClick={click('Abs')}
          material={currentGetMaterial('Abs')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <capsuleGeometry args={[0.35, 0.6, 8, 16]} />
        </mesh>

        {/* Shoulders */}
        <mesh
          position={[-1, 4.1, 0]}
          onPointerOver={over('Shoulders')}
          onPointerOut={out}
          onClick={click('Shoulders')}
          material={currentGetMaterial('Shoulders')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <sphereGeometry args={[0.28, 32, 32]} />
        </mesh>
        <mesh
          position={[1, 4.1, 0]}
          onPointerOver={over('Shoulders')}
          onPointerOut={out}
          onClick={click('Shoulders')}
          material={currentGetMaterial('Shoulders')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <sphereGeometry args={[0.28, 32, 32]} />
        </mesh>

        {/* Arms */}
        <group position={[-1.1, 3.4, 0]}>
          <mesh
            position={[0, 0, 0.15]}
            onPointerOver={over('Biceps')}
            onPointerOut={out}
            onClick={click('Biceps')}
            material={currentGetMaterial('Biceps')}
            scale={[definitionScale, definitionScale, definitionScale]}
          >
            <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
          </mesh>
          <mesh
            position={[0, 0, -0.15]}
            onPointerOver={over('Triceps')}
            onPointerOut={out}
            onClick={click('Triceps')}
            material={currentGetMaterial('Triceps')}
            scale={[definitionScale, definitionScale, definitionScale]}
          >
            <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
          </mesh>
        </group>

        <group position={[1.1, 3.4, 0]}>
          <mesh
            position={[0, 0, 0.15]}
            onPointerOver={over('Biceps')}
            onPointerOut={out}
            onClick={click('Biceps')}
            material={currentGetMaterial('Biceps')}
            scale={[definitionScale, definitionScale, definitionScale]}
          >
            <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
          </mesh>
          <mesh
            position={[0, 0, -0.15]}
            onPointerOver={over('Triceps')}
            onPointerOut={out}
            onClick={click('Triceps')}
            material={currentGetMaterial('Triceps')}
            scale={[definitionScale, definitionScale, definitionScale]}
          >
            <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
          </mesh>
        </group>

        <mesh
          position={[-1.25, 2.5, 0]}
          onPointerOver={over('Forearms')}
          onPointerOut={out}
          onClick={click('Forearms')}
          material={currentGetMaterial('Forearms')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        </mesh>
        <mesh
          position={[1.25, 2.5, 0]}
          onPointerOver={over('Forearms')}
          onPointerOut={out}
          onClick={click('Forearms')}
          material={currentGetMaterial('Forearms')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        </mesh>

        {/* Hands */}
        <mesh position={[-1.4, 1.8, 0]} material={neutralMat}>
          <boxGeometry args={[0.15, 0.25, 0.1]} />
        </mesh>
        <mesh position={[1.4, 1.8, 0]} material={neutralMat}>
          <boxGeometry args={[0.15, 0.25, 0.1]} />
        </mesh>

        {/* ─── Back Muscles ─── */}
        <mesh
          position={[0, 4.3, -0.3]}
          onPointerOver={over('Traps')}
          onPointerOut={out}
          onClick={click('Traps')}
          material={currentGetMaterial('Traps')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <boxGeometry args={[0.8, 0.3, 0.1]} />
        </mesh>
        <mesh
          position={[0, 3.5, -0.4]}
          onPointerOver={over('Lats')}
          onPointerOut={out}
          onClick={click('Lats')}
          material={currentGetMaterial('Lats')}
          scale={[definitionScale, definitionScale, definitionScale]}
        >
          <boxGeometry args={[1.2, 0.9, 0.1]} />
        </mesh>
      </group>

      {/* ─── Lower Body ─── */}
      <mesh
        position={[0, 1.8, -0.4]}
        onPointerOver={over('Glutes')}
        onPointerOut={out}
        onClick={click('Glutes')}
        material={currentGetMaterial('Glutes')}
      >
        <capsuleGeometry args={[0.45, 0.5, 16, 32]} rotation={[0, 0, Math.PI / 2]} />
      </mesh>

      {/* Legs */}
      <group position={[-0.4, 1.1, 0]}>
        <mesh
          position={[0, 0, 0.15]}
          onPointerOver={over('Quads')}
          onPointerOut={out}
          onClick={click('Quads')}
          material={currentGetMaterial('Quads')}
        >
          <capsuleGeometry args={[0.28, 0.9, 8, 16]} />
        </mesh>
        <mesh
          position={[0, 0, -0.15]}
          onPointerOver={over('Hamstrings')}
          onPointerOut={out}
          onClick={click('Hamstrings')}
          material={currentGetMaterial('Hamstrings')}
        >
          <capsuleGeometry args={[0.25, 0.9, 8, 16]} />
        </mesh>
      </group>

      <group position={[0.4, 1.1, 0]}>
        <mesh
          position={[0, 0, 0.15]}
          onPointerOver={over('Quads')}
          onPointerOut={out}
          onClick={click('Quads')}
          material={currentGetMaterial('Quads')}
        >
          <capsuleGeometry args={[0.28, 0.9, 8, 16]} />
        </mesh>
        <mesh
          position={[0, 0, -0.15]}
          onPointerOver={over('Hamstrings')}
          onPointerOut={out}
          onClick={click('Hamstrings')}
          material={currentGetMaterial('Hamstrings')}
        >
          <capsuleGeometry args={[0.25, 0.9, 8, 16]} />
        </mesh>
      </group>

      <mesh
        position={[-0.45, 0, 0]}
        onPointerOver={over('Calves')}
        onPointerOut={out}
        onClick={click('Calves')}
        material={currentGetMaterial('Calves')}
        scale={[definitionScale, definitionScale, definitionScale]}
      >
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
      </mesh>
      <mesh
        position={[0.45, 0, 0]}
        onPointerOver={over('Calves')}
        onPointerOut={out}
        onClick={click('Calves')}
        material={currentGetMaterial('Calves')}
        scale={[definitionScale, definitionScale, definitionScale]}
      >
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.45, -0.5, 0.1]} material={neutralMat}>
        <boxGeometry args={[0.2, 0.1, 0.4]} />
      </mesh>
      <mesh position={[0.45, -0.5, 0.1]} material={neutralMat}>
        <boxGeometry args={[0.2, 0.1, 0.4]} />
      </mesh>

      {/* ─── Skeleton Overlay (Data Driven) ─── */}
      {poseLandmarks && (
        <group>
          {[
            [11, 12], [11, 23], [12, 24], [23, 24], // Torso
            [11, 13], [13, 15], // Left Arm
            [12, 14], [14, 16], // Right Arm
            [23, 25], [25, 27], // Left Leg
            [24, 26], [26, 28], // Right Leg
          ].map(([start, end], i) => {
            const p1 = getLandmarkPos(start);
            const p2 = getLandmarkPos(end);
            if (!p1 || !p2) return null;
            
            const points = [p1, p2];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            
            return (
              <line key={i} geometry={lineGeometry}>
                <lineBasicMaterial color="#00F0FF" linewidth={2} transparent opacity={0.8} />
              </line>
            );
          })}
          
          {/* Joint Spheres */}
          {[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map(idx => {
            const pos = getLandmarkPos(idx);
            if (!pos) return null;
            return (
              <mesh key={idx} position={pos}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            );
          })}
        </group>
      )}

      {/* ─── Mode Specific Elements ─── */}
      {visualMode === 'power' && (
        <group>
          {/* Joint Highlights */}
          <mesh position={[-1, 4.1, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#FDB913" /></mesh>
          <mesh position={[1, 4.1, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#FDB913" /></mesh>
          <mesh position={[-0.4, 1.8, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#FDB913" /></mesh>
          <mesh position={[0.4, 1.8, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#FDB913" /></mesh>
          <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.02, 0.02, 2]} /><meshBasicMaterial color="#FDB913" transparent opacity={0.5} /></mesh>
        </group>
      )}

      {visualMode === 'endurance' && (
        <group>
          {/* Pulsing Heart */}
          <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={[0, 4, 0.5]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color="#00F0FF" />
            </mesh>
          </Float>
          {/* Vein lines */}
          <mesh position={[0, 3, 0.4]} rotation={[0, 0, Math.PI/4]}>
            <cylinderGeometry args={[0.01, 0.01, 1.5]} />
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── Camera Animator ──────────────────────────────────────────────────────────
function CameraAnimator({ activeMuscle }: { activeMuscle: MuscleGroup }) {
  const controls = useRef<CameraControls>(null);

  useEffect(() => {
    if (!controls.current) return;
    if (activeMuscle === 'Chest' || activeMuscle === 'Abs') {
      controls.current.setLookAt(0, 2.5, 4, 0, 1.5, 0, true);
    } else if (activeMuscle === 'Quads' || activeMuscle === 'Calves' || activeMuscle === 'Glutes') {
      controls.current.setLookAt(0, -0.5, 4, 0, -1, 0, true);
    } else if (activeMuscle === 'Biceps' || activeMuscle === 'Forearms' || activeMuscle === 'Shoulders') {
      controls.current.setLookAt(-2, 1.5, 4, -1.2, 1, 0, true);
    } else if (activeMuscle === 'Back' || activeMuscle === 'Traps' || activeMuscle === 'Lats') {
      controls.current.setLookAt(0, 2, -4, 0, 1, 0, true);
    } else {
      controls.current.setLookAt(0, 2, 8, 0, 0, 0, true);
    }
  }, [activeMuscle]);

  useFrame((state) => {
    if (!controls.current || activeMuscle) return;
    const t = state.clock.getElapsedTime();
    // Slow cinematic orbit
    const x = Math.sin(t * 0.2) * 8;
    const z = Math.cos(t * 0.2) * 8;
    controls.current.setPosition(x, 2, z, true);
  });

  return <CameraControls ref={controls} makeDefault minDistance={2} maxDistance={12} />;
}

// ─── Readiness Legend (HTML overlay) ───────────────────────────────────
function ReadinessLegend({ muscleReadiness }: { muscleReadiness: Record<string, MuscleReadiness> }) {
  const order: MuscleReadiness[] = ['fatigued', 'recovering', 'ready', 'primed', 'fresh', 'unknown'];
  // Only show states that exist in current data, plus always show fatigued/fresh
  const present = new Set(Object.values(muscleReadiness));
  const toShow = order.filter(s => present.has(s) || s === 'fatigued' || s === 'fresh');

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-panel/90 border border-border rounded-xl p-3 backdrop-blur-sm">
      <p className="text-text-main text-xs font-bold uppercase tracking-wider mb-2.5">Muscle Readiness</p>
      <div className="space-y-1.5">
        {toShow.map(state => {
          const cfg = READINESS_CONFIG[state];
          return (
            <div key={state} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}60, 0 0 0 1px ${cfg.color}40` }}
              />
              <div>
                <span className="text-text-main text-[11px] font-medium">{cfg.label}</span>
                <span className="text-text-muted text-[10px] ml-1.5">{cfg.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GLBFigure ────────────────────────────────────────────────────────────────
export function GLBFigure({
  onMuscleClick,
  weightScale,
  muscleReadiness = {},
  hovered,
  setHovered,
  definitionScale = 1,
  posture = 0,
  auraColor = null,
  visualMode = 'power',
  soreness = {},
  activeSkin = 'blue',
  poseLandmarks = null,
  setMeshNames
}: any) {
  const { scene } = useGLTF('/male_base_muscular_anatomy.glb');
  const group = useRef<THREE.Group>(null);
  
  // Create a copy of the scene to avoid mutating the cached original
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Extract mesh names once on load
  useEffect(() => {
    const names: string[] = [];
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        names.push(mesh.name || 'Unnamed Mesh');
      }
    });
    console.log("GLB Mesh Names found:", names);
    if (setMeshNames) {
      setMeshNames(names);
    }
  }, [clonedScene, setMeshNames]);

  // Fuzzy match function for muscle names
  const mapMeshNameToMuscle = (meshName: string): MuscleGroup => {
    const name = meshName.toLowerCase();
    if (name.includes('chest') || name.includes('pectoralis')) return 'Chest';
    if (name.includes('abs') || name.includes('abdomin') || name.includes('rectus abdominis')) return 'Abs';
    if (name.includes('shoulder') || name.includes('deltoid')) return 'Shoulders';
    if (name.includes('bicep')) return 'Biceps';
    if (name.includes('tricep')) return 'Triceps';
    if (name.includes('forearm') || name.includes('brachio')) return 'Forearms';
    if (name.includes('trap') || name.includes('trapezius')) return 'Traps';
    if (name.includes('lat') || name.includes('latissimus')) return 'Lats';
    if (name.includes('glute')) return 'Glutes';
    if (name.includes('quad') || name.includes('rectus femoris') || name.includes('vastus')) return 'Quads';
    if (name.includes('hamstring') || name.includes('biceps femoris') || name.includes('semitend')) return 'Hamstrings';
    if (name.includes('calf') || name.includes('calves') || name.includes('gastrocnemius') || name.includes('soleus')) return 'Calves';
    
    const exactMatches: Record<string, MuscleGroupName> = {
      'chest': 'Chest',
      'abs': 'Abs',
      'shoulders': 'Shoulders',
      'biceps': 'Biceps',
      'triceps': 'Triceps',
      'forearms': 'Forearms',
      'traps': 'Traps',
      'lats': 'Lats',
      'glutes': 'Glutes',
      'quads': 'Quads',
      'hamstrings': 'Hamstrings',
      'calves': 'Calves'
    };
    
    for (const [key, value] of Object.entries(exactMatches)) {
      if (name === key) return value;
    }
    
    return null;
  };

  // Dynamically update materials based on muscle states and hovers
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const muscle = mapMeshNameToMuscle(mesh.name);
        
        if (muscle) {
          const isHovered = hovered === muscle;
          
          if (visualMode === 'recovery') {
            const level = soreness[muscle] ?? 0;
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isHovered ? '#ffffff' : level > 0 ? '#A78BFA' : '#1f2937',
              emissive: level > 0 ? '#8B5CF6' : '#000000',
              emissiveIntensity: isHovered ? 0.8 : level * 2,
              metalness: 0.5,
              roughness: 0.2,
              transparent: true,
              opacity: 0.9,
            });
          } else {
            const readiness = muscleReadiness[muscle] ?? 'unknown';
            const cfg = READINESS_CONFIG[readiness];
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isHovered ? '#ffffff' : cfg.color,
              metalness: 0.2,
              roughness: 0.3,
              transmission: isHovered ? 0.35 : 0.1,
              thickness: 1.5,
              emissive: isHovered ? '#ffffff' : cfg.emissive,
              emissiveIntensity: isHovered ? 0.8 : (readiness === 'unknown' ? 0.1 : 0.5),
              transparent: true,
              opacity: 0.95,
            });
          }
        } else {
          // Unmapped base body or skeleton elements
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: visualMode === 'power' ? '#FDB913' : '#38B6FF',
            metalness: 0.8,
            roughness: 0.2,
            transmission: 0.5,
            thickness: 1.5,
            transparent: true,
            opacity: 0.35,
            emissive: visualMode === 'power' ? '#FDB913' : '#38B6FF',
            emissiveIntensity: 0.1,
          });
        }
      }
    });
  }, [clonedScene, hovered, muscleReadiness, soreness, visualMode]);

  // Compute bounding box dimensions to auto-scale the model to target height
  const scaleFactor = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Target height in world units (similar height to HumanFigure)
    const targetHeight = 5.0;
    const factor = targetHeight / Math.max(size.y, 0.001);
    console.log("GLB original size:", size, "computed scaleFactor:", factor);
    return factor;
  }, [clonedScene]);

  useFrame(() => {
    if (group.current) {
      const currentScale = weightScale * scaleFactor;
      group.current.scale.lerp(new THREE.Vector3(currentScale, currentScale, currentScale), 0.1);
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <Center>
        <primitive
          object={clonedScene}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            const meshName = e.object.name;
            const muscle = mapMeshNameToMuscle(meshName);
            if (muscle) {
              setHovered(muscle);
              document.body.style.cursor = 'pointer';
            }
          }}
          onPointerOut={(e: any) => {
            e.stopPropagation();
            setHovered(null);
            document.body.style.cursor = 'default';
          }}
          onClick={(e: any) => {
            e.stopPropagation();
            const meshName = e.object.name;
            const muscle = mapMeshNameToMuscle(meshName);
            if (muscle) {
              onMuscleClick(muscle);
            }
          }}
        />
      </Center>
    </group>
  );
}

// Preload the model so it loads instantly
useGLTF.preload('/male_base_muscular_anatomy.glb');

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Anatomy3D({
  activeMuscle,
  onMuscleClick,
  weightScale = 1,
  muscleReadiness = {},
  definitionScale = 1,
  posture = 0,
  auraColor = null,
  visualMode = 'power',
  soreness = {},
  activeSkin = 'blue',
  poseLandmarks = null
}: Anatomy3DProps & { definitionScale?: number; posture?: number; auraColor?: string | null; visualMode?: TrainingMode; soreness?: Record<string, number>; activeSkin?: string; poseLandmarks?: any }) {
  const [hovered, setHovered] = useState<MuscleGroup>(null);

  return (
    <div className="w-full h-[500px] bg-panel rounded-2xl overflow-hidden border border-border relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-text-main font-medium text-lg">Muscle Heatmap</h3>
        <p className="text-text-muted text-sm">Click a muscle for personalised insights</p>
      </div>



      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <color attach="background" args={['#F9F8F6']} />
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={1} color="#2D5BFF" />
        <Environment preset="city" />

        <HumanFigure
          onMuscleClick={onMuscleClick}
          weightScale={weightScale}
          muscleReadiness={muscleReadiness}
          hovered={hovered}
          setHovered={setHovered}
          definitionScale={definitionScale}
          posture={posture}
          auraColor={auraColor}
          visualMode={visualMode}
          soreness={soreness}
          activeSkin={activeSkin}
          poseLandmarks={poseLandmarks}
        />

        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <CameraAnimator activeMuscle={activeMuscle} />
      </Canvas>

      {/* Legend */}
      <ReadinessLegend muscleReadiness={muscleReadiness} />
    </div>
  );
}
