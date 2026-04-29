import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, CameraControls } from '@react-three/drei';
import type { UserProfile } from '../../types';
import { calculateBMI, getIdealWeight, calculateNutrition } from '../../lib/calculations';
import { HumanFigure } from '../dashboard/Anatomy3D';
import type { MuscleGroup } from '../dashboard/Anatomy3D';

interface Props {
  profile: UserProfile;
}

function BodyAvatar({ weightScale }: { weightScale: number }) {
  const [hovered, setHovered] = useState<MuscleGroup>(null);
  
  return (
    <div className="w-full h-[400px] bg-[#0d0d0d] rounded-2xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <color attach="background" args={['#0d0d0d']} />
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={1} color="#2D5BFF" />
        <Environment preset="city" />

        <HumanFigure
          onMuscleClick={() => {}}
          weightScale={weightScale}
          muscleReadiness={{}}
          hovered={hovered}
          setHovered={setHovered}
        />

        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <CameraControls makeDefault minDistance={4} maxDistance={10} />
      </Canvas>
    </div>
  );
}

function MeasurementLine({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[#9ca3af] text-xs">{label}</span>
        <span className="text-white text-xs font-semibold">{value.toFixed(1)} <span className="text-[#4b5563]">kg</span></span>
      </div>
      <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AvatarView({ profile }: Props) {
  const bmi = calculateBMI(profile.weight_kg, profile.height_cm);
  const nutrition = calculateNutrition(profile);
  const idealWeight = getIdealWeight(profile.height_cm, profile.gender);
  const [animated, setAnimated] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      setTimeout(() => setAnimated(true), 100);
      setTimeout(() => setAnimated(false), 2000);
    }
  }, []);

  const fatMass = parseFloat((profile.weight_kg * (bmi.value / 50)).toFixed(1));
  const muscleMass = parseFloat((profile.weight_kg - fatMass).toFixed(1));
  const waterMass = parseFloat((profile.weight_kg * 0.6).toFixed(1));

  const bmiRanges = [
    { label: 'Underweight', min: 0, max: 18.5, color: '#3b82f6' },
    { label: 'Healthy', min: 18.5, max: 25, color: '#10b981' },
    { label: 'Overweight', min: 25, max: 30, color: '#f59e0b' },
    { label: 'Obese', min: 30, max: 40, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Body Avatar</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">3D visualization based on your biometric data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 flex flex-col items-center">
          <div className="relative w-full">
            <BodyAvatar weightScale={1 + ((profile.weight_kg - idealWeight) / profile.weight_kg)} />

            <div className="absolute top-4 right-4 space-y-2">
              <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-right shadow-xl">
                <p className="text-[#6b7280] text-[10px] uppercase tracking-widest font-bold">BMI Index</p>
                <p className="text-white text-lg font-black">{bmi.value}</p>
              </div>
              <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-right shadow-xl">
                <p className="text-[#6b7280] text-[10px] uppercase tracking-widest font-bold">Health Status</p>
                <p className="font-bold text-sm" style={{ color: bmi.color }}>{bmi.category}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center">
            <p className="text-white font-bold text-xl">{profile.name}</p>
            <p className="text-[#6b7280] text-sm">
              {profile.height_cm}cm · {profile.weight_kg}kg · {profile.age}yrs
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
            <h3 className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider mb-5">Body Composition (Estimated)</h3>
            <div className="space-y-4">
              <MeasurementLine label="Estimated Fat Mass" value={fatMass} max={profile.weight_kg} color="#ef4444" />
              <MeasurementLine label="Estimated Lean Mass" value={muscleMass} max={profile.weight_kg} color="#3b82f6" />
              <MeasurementLine label="Total Body Water" value={waterMass} max={profile.weight_kg} color="#06b6d4" />
              <MeasurementLine label="Ideal Body Weight" value={idealWeight} max={profile.weight_kg * 1.5} color="#10b981" />
            </div>

            <div className="mt-5 h-3 bg-[#1f1f1f] rounded-full overflow-hidden flex">
              <div className="h-full bg-[#3b82f6] transition-all duration-1000" style={{ width: `${(muscleMass / profile.weight_kg) * 100}%` }} />
              <div className="h-full bg-[#ef4444] transition-all duration-1000" style={{ width: `${(fatMass / profile.weight_kg) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                <span className="text-[#6b7280] text-xs">Lean Mass {Math.round((muscleMass / profile.weight_kg) * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span className="text-[#6b7280] text-xs">Fat Mass {Math.round((fatMass / profile.weight_kg) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
            <h3 className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider mb-5">BMI Scale</h3>
            <div className="relative h-4 rounded-full overflow-hidden mb-3">
              <div className="absolute inset-0 flex">
                {bmiRanges.map(r => (
                  <div key={r.label} className="h-full flex-1" style={{ backgroundColor: `${r.color}40` }} />
                ))}
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-1000"
                style={{
                  left: `${Math.min(95, Math.max(2, ((bmi.value - 15) / 25) * 100))}%`,
                  backgroundColor: bmi.color,
                }}
              />
            </div>
            <div className="flex justify-between">
              {bmiRanges.map(r => (
                <div key={r.label} className="text-center flex-1">
                  <p style={{ color: r.color }} className="text-[10px] font-medium">{r.label}</p>
                  <p className="text-[#4b5563] text-[9px]">{r.min}–{r.max}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Target Calories', value: `${nutrition.targetCalories}`, unit: 'kcal/day', color: '#10b981' },
              { label: 'Protein Need', value: `${nutrition.targetProtein}g`, unit: 'per day', color: '#3b82f6' },
              { label: 'Ideal Weight', value: `${idealWeight}kg`, unit: 'target', color: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 text-center">
                <p className="text-[#6b7280] text-[10px] uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[#4b5563] text-[10px]">{stat.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
