import { useState, useEffect } from 'react';
import { Wind, Droplets, Zap, Activity, Smile, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  isVeg: boolean;
  sorenessMap: Record<string, number>;
  onSorenessChange: (soreness: Record<string, number>) => void;
}

export default function RecoverySection({ isVeg, sorenessMap, onSorenessChange }: Props) {
  const [breathPhase, setBreathPhase] = useState(0); // 0: In, 1: Hold, 2: Out, 3: Hold
  const [waterLevel, setWaterLevel] = useState(65); // percentage
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // Sync selected muscle when map changes from outside (3D click)
  useEffect(() => {
    const lastMuscle = Object.keys(sorenessMap).pop();
    if (lastMuscle) setSelectedMuscle(lastMuscle);
  }, [sorenessMap]);

  // Box Breathing Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setBreathPhase((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const breathText = ['Inhale', 'Hold', 'Exhale', 'Hold'];

  const stretches: Record<string, string[]> = {
    Chest: ['Doorway Stretch', 'Pec Foam Rolling', 'Scapular Squeezes'],
    Quads: ['Couch Stretch', 'Quad Foam Rolling', 'Kneeling Quad Stretch'],
    Abs: ['Cobra Pose', 'Cat-Cow', 'Child\'s Pose'],
    Shoulders: ['Cross-body Stretch', 'Wall Slides', 'Child\'s Pose with Reach'],
    Biceps: ['Wall Bicep Stretch', 'Arm Circles', 'Wrist Pull-backs'],
    Back: ['Cat-Cow', 'Thread the Needle', 'Lat Stretch'],
    Lats: ['Lat Stretch', 'Foam Rolling Lats', 'Child\'s Pose'],
    Glutes: ['Pigeon Pose', 'Figure Four Stretch', 'Glute Foam Rolling'],
    Hamstrings: ['Hamstring Stretch', 'Leg Swings', 'Foam Rolling Hams'],
    Calves: ['Wall Calf Stretch', 'Down Dog', 'Ankle Circles'],
  };

  const handleSoreness = (muscle: string, level: number) => {
    const newMap = { ...sorenessMap, [muscle]: level };
    onSorenessChange(newMap);
    setSelectedMuscle(muscle);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DOMS Logger & Stretching */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-[#064e3b] border border-[#A78BFA]/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center">
              <Activity size={20} className="text-[#A78BFA]" />
            </div>
            <div>
              <h3 className="text-white font-bold">Muscle Soreness Tracker</h3>
              <p className="text-[#A78BFA]/60 text-[10px] uppercase tracking-widest font-black">Generate Custom Stretching</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                Click on the 3D model (or select a muscle below) to log soreness. We will instantly generate a stretching routine for you.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(stretches).map(muscle => (
                  <button
                    key={muscle}
                    onClick={() => handleSoreness(muscle, 0.8)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      sorenessMap[muscle] ? 'bg-[#A78BFA] text-black' : 'bg-white/5 text-[#94a3b8] hover:bg-white/10'
                    }`}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-6 min-h-[200px]">
              {selectedMuscle ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={selectedMuscle}
                >
                  <h4 className="text-[#A78BFA] font-bold text-sm mb-4 uppercase tracking-widest">{selectedMuscle} Stretching Routine</h4>
                  <div className="space-y-3">
                    {stretches[selectedMuscle]?.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Waves size={14} className="text-[#A78BFA]" />
                        <span className="text-white text-xs">{s}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Smile size={32} className="text-[#A78BFA] mb-2" />
                  <p className="text-white text-xs">No soreness logged yet.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Guided Breathwork */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#064e3b] border border-[#A78BFA]/20 rounded-2xl p-6 flex flex-col items-center justify-between"
        >
          <div className="w-full flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Wind size={20} className="text-[#A78BFA]" />
            </div>
            <span className="text-white font-bold">Stress Relief Breathing</span>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div 
              animate={{ 
                scale: breathPhase === 0 ? 1.5 : breathPhase === 2 ? 0.8 : breathPhase === 1 ? 1.5 : 0.8,
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute w-32 h-32 rounded-full bg-[#A78BFA] blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: breathPhase === 0 ? 1.2 : breathPhase === 2 ? 0.8 : breathPhase === 1 ? 1.2 : 0.8
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full border-4 border-[#A78BFA] flex items-center justify-center z-10"
            >
              <span className="text-white font-black text-xs uppercase tracking-widest">{breathText[breathPhase]}</span>
            </motion.div>
          </div>

          <p className="mt-8 text-[#A78BFA]/60 text-[10px] uppercase font-black text-center tracking-tighter">
            Follow the expanding circle to relax
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hydration Tracker */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#064e3b] border border-[#A78BFA]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8"
        >
          <div className="relative w-24 h-32 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
            <motion.div 
              animate={{ height: `${waterLevel}%` }}
              className="absolute bottom-0 left-0 w-full bg-[#38B6FF] opacity-60"
            >
              <motion.div 
                animate={{ x: [-100, 100] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-2 bg-white/20 blur-sm"
              />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Droplets size={24} className="text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-bold">Post-Workout Hydration</span>
              <span className="text-[10px] font-black bg-[#A78BFA] text-black px-2 py-0.5 rounded">RECOMMENDED</span>
            </div>
            <p className="text-[#94a3b8] text-sm mb-4">
              Based on your earlier High-Intensity workout, we suggest 400mg of Potassium and 200mg of Magnesium.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setWaterLevel(Math.min(100, waterLevel + 10))} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs font-bold transition-colors">
                +250ml Water
              </button>
              <button className="px-4 py-2 bg-[#A78BFA]/10 text-[#A78BFA] rounded-lg text-xs font-bold transition-colors">
                Log Electrolytes
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recovery Nutrition */}
        <div className="bg-gradient-to-r from-[#064e3b] to-[#065f46] border border-[#A78BFA]/20 rounded-2xl p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center flex-shrink-0">
            <Zap size={32} className="text-[#A78BFA]" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-lg mb-1">Restorative Feeding</h4>
            <p className="text-[#94a3b8] text-sm">
              Recovery is about anti-inflammation. Load up on {isVeg ? 'Spinach, Walnuts, and Curcumin' : 'Wild Salmon, Tart Cherry, and Ginger'} to accelerate tissue repair.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
