import { useState, useMemo } from 'react';
import { Zap, Calculator, Box, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  isVeg: boolean;
}

export default function PowerSection({ isVeg }: Props) {
  const [exerciseName, setExerciseName] = useState('Bench Press');
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(5);
  const [plateWeight, setPlateWeight] = useState(140);

  // 1RM Prediction (Epley Formula)
  const oneRM = useMemo(() => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }, [weight, reps]);

  // Plate Calculator logic (standard 20kg bar)
  const plates = useMemo(() => {
    const sideWeight = (plateWeight - 20) / 2;
    if (sideWeight < 0) return [];
    
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const result: number[] = [];
    let remaining = sideWeight;

    for (const plate of availablePlates) {
      while (remaining >= plate) {
        result.push(plate);
        remaining -= plate;
      }
    }
    return result;
  }, [plateWeight]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1RM Predictor */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-panel border border-[#FDB913]/40 rounded-2xl p-6 relative overflow-hidden group shadow-sm"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Calculator size={120} className="text-[#FDB913]" />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 flex items-center justify-center">
               <TrendingUp size={20} className="text-[#FDB913]" />
            </div>
            <div>
              <h3 className="text-text-main font-bold">1-Rep Max Calculator</h3>
              <p className="text-text-muted text-xs uppercase tracking-widest font-semibold">Estimate Your Strength</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Exercise Name</label>
              <input 
                type="text" 
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Squat, Bench Press"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-bold focus:border-[#FDB913]/50 transition-colors outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Weight Lifted (kg)</label>
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-bold focus:border-[#FDB913]/50 transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Reps Completed</label>
                <input 
                  type="number" 
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-bold focus:border-[#FDB913]/50 transition-colors outline-none"
                />
              </div>
            </div>

            <div className="bg-[#FDB913]/5 border border-[#FDB913]/10 rounded-2xl p-6 text-center mt-2 animate-fade-in">
              <p className="text-[#FDB913] text-xs font-bold uppercase tracking-tighter mb-1">
                Predicted Max for {exerciseName || 'this exercise'}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-text-main">{oneRM}</span>
                <span className="text-xl font-bold text-[#FDB913]">KG</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plate Calculator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-panel border border-[#FDB913]/40 rounded-2xl p-6 relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 flex items-center justify-center">
              <Box size={20} className="text-[#FDB913]" />
            </div>
            <div>
              <h3 className="text-text-main font-bold">Plate Calculator</h3>
              <p className="text-text-muted text-xs uppercase tracking-widest font-semibold">Loading Optimization</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Target Total Weight (kg)</label>
              <div className="flex gap-3">
                <input 
                  type="range" 
                  min="20" 
                  max="300" 
                  step="2.5"
                  value={plateWeight}
                  onChange={(e) => setPlateWeight(Number(e.target.value))}
                  className="flex-1 accent-[#FDB913]"
                />
                <span className="text-text-main font-bold w-12 text-right">{plateWeight}kg</span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 min-h-[140px] flex flex-col justify-center">
              <p className="text-text-muted text-[10px] uppercase font-bold mb-4 text-center">Per Side (Standard 20kg Bar)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {plates.length === 0 ? (
                  <p className="text-text-muted text-sm italic">Just the bar!</p>
                ) : (
                  plates.map((p, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-12 h-12 rounded-full border-2 border-[#FDB913] bg-[#FDB913]/10 flex items-center justify-center"
                    >
                      <span className="text-[#FDB913] text-[10px] font-black">{p}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Strength Lab Nutrition Overlay */}
      <div className="bg-gradient-to-r from-surface to-panel border border-[#FDB913]/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#FDB913] flex items-center justify-center flex-shrink-0 shadow-md">
          <Zap size={32} className="text-black fill-black" />
        </div>
        <div className="flex-1">
          <h4 className="text-text-main font-bold text-lg mb-1">Fuel for Intensity</h4>
          <p className="text-text-muted text-sm font-medium">
            Power mode requires high ATP turnover. Focus on Creatine Monohydrate and {isVeg ? 'Whey Isolate/Paneer' : 'Lean Beef/Chicken Breast'} for muscle density.
          </p>
        </div>
        <button className="px-6 py-3 bg-[#FDB913] text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-md">
          Full Power Diet
        </button>
      </div>
    </div>
  );
}
