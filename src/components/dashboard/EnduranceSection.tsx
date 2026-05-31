import { useState, useMemo } from 'react';
import { Timer, Wind, Activity, Heart, ChevronRight, Route, Bike, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isVeg: boolean;
}

type CardioMode = 'running' | 'cycling' | 'swimming';

export default function EnduranceSection({}: Props) {
  const [cardioMode, setCardioMode] = useState<CardioMode>('running');
  const [distance, setDistance] = useState(5); // km or laps
  const [time, setTime] = useState(25); // minutes
  const [elevation, setElevation] = useState(100); // meters (for cycling)
  const [hr, setHr] = useState(145);

  // VO2 Max Estimation
  const estimatedVO2 = useMemo(() => {
    let pace = time / (distance || 1);
    if (cardioMode === 'cycling') pace = pace * 3; // Adjust for cycling
    if (cardioMode === 'swimming') pace = pace / 4; // Adjust for swimming
    
    if (pace < 4) return 55;
    if (pace < 5) return 48;
    if (pace < 6) return 42;
    return 35;
  }, [distance, time, cardioMode]);

  const hrZones = [
    { label: 'Z1 Warmup / Recovery', range: '110-125', color: 'bg-emerald-500', desc: 'Easy effort, breathing easily' },
    { label: 'Z2 Fat Burn / Base', range: '126-140', color: 'bg-blue-500', desc: 'Conversational pace, builds stamina' },
    { label: 'Z3 Tempo / Aerobic', range: '141-155', color: 'bg-yellow-500', desc: 'Slightly uncomfortable, sweaty' },
    { label: 'Z4 Threshold', range: '156-170', color: 'bg-orange-500', desc: 'Hard effort, heavy breathing' },
    { label: 'Z5 Maximum / Sprint', range: '171+', color: 'bg-red-500', desc: 'All out effort, cannot sustain' },
  ];

  return (
    <div className="space-y-6">
      {/* Cardio Tracking Module */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-panel border border-[#00F0FF]/30 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
              <Activity size={20} className="text-[#00C2D1]" />
            </div>
            <div>
              <h3 className="text-text-main font-bold">Cardio Tracker</h3>
              <p className="text-[#00C2D1] text-[10px] uppercase tracking-widest font-bold">Log Your Session</p>
            </div>
          </div>
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            <button onClick={() => setCardioMode('running')} className={`p-2 rounded-md transition-colors ${cardioMode === 'running' ? 'bg-[#00F0FF]/20 text-[#008A96]' : 'text-text-muted hover:text-text-main'}`}>
              <Route size={16} />
            </button>
            <button onClick={() => setCardioMode('cycling')} className={`p-2 rounded-md transition-colors ${cardioMode === 'cycling' ? 'bg-[#00F0FF]/20 text-[#008A96]' : 'text-text-muted hover:text-text-main'}`}>
              <Bike size={16} />
            </button>
            <button onClick={() => setCardioMode('swimming')} className={`p-2 rounded-md transition-colors ${cardioMode === 'swimming' ? 'bg-[#00F0FF]/20 text-[#008A96]' : 'text-text-muted hover:text-text-main'}`}>
              <Waves size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">
              {cardioMode === 'swimming' ? 'Laps' : 'Distance (km)'}
            </label>
            <input 
              type="number" 
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-bold focus:border-[#00F0FF]/50 transition-colors outline-none"
            />
          </div>
          <div>
            <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Time (minutes)</label>
            <input 
              type="number" 
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-bold focus:border-[#00F0FF]/50 transition-colors outline-none"
            />
          </div>
          <AnimatePresence mode="popLayout">
            {cardioMode === 'cycling' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Elevation (m)</label>
                <input 
                  type="number" 
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-bold focus:border-[#00F0FF]/50 transition-colors outline-none"
                />
              </motion.div>
            )}
            {cardioMode !== 'cycling' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col justify-end"
              >
                 <div className="w-full bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Avg Pace</span>
                    <span className="text-text-main font-black text-sm">{(time / (distance || 1)).toFixed(2)} {cardioMode === 'swimming' ? 'min/lap' : 'min/km'}</span>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pace & Zone Tracker */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-panel border border-[#00F0FF]/30 rounded-2xl p-6 relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
              <Heart size={20} className="text-[#00C2D1]" />
            </div>
            <div>
              <h3 className="text-text-main font-bold">Heart Rate Zones</h3>
              <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">Understand Your Effort</p>
            </div>
          </div>

          <div className="space-y-4">
            {hrZones.map((zone, i) => {
              const isActive = hr >= parseInt(zone.range.split('-')[0]) && (zone.range.includes('+') || hr <= parseInt(zone.range.split('-')[1]));
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-all border ${isActive ? 'bg-[#00F0FF]/5 border-[#00C2D1]/40 shadow-sm' : 'opacity-40 border-transparent'}`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-4 rounded-full ${zone.color}`} />
                      <span className="text-text-main text-sm font-bold">{zone.label}</span>
                    </div>
                    <span className="text-text-muted text-[10px] pl-4 font-medium">{zone.desc}</span>
                  </div>
                  <span className="text-text-muted text-xs font-mono font-bold">{zone.range} BPM</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-surface p-4 rounded-xl border border-border">
            <label className="block text-text-muted text-[10px] uppercase font-bold mb-3 text-center">Interactive HR Simulator</label>
            <input 
              type="range" 
              min="100" 
              max="190" 
              value={hr}
              onChange={(e) => setHr(Number(e.target.value))}
              className="w-full accent-[#00C2D1]"
            />
            <p className="text-center text-text-main font-black mt-2">{hr} BPM</p>
          </div>
        </motion.div>

        {/* VO2 Max & Performance */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-panel border border-[#00F0FF]/30 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Wind size={20} className="text-[#00C2D1]" />
                <span className="text-text-main font-bold">VO2 Max Estimate</span>
              </div>
              <span className="px-2 py-1 rounded bg-[#00F0FF]/10 text-[#008A96] text-[10px] font-black uppercase">Aerobic Power</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251} strokeDashoffset={251 - (estimatedVO2 / 60) * 251} className="text-[#00C2D1] transition-all duration-1000" />
                </svg>
                <span className="absolute text-2xl font-black text-text-main">{estimatedVO2}</span>
              </div>
              <div className="flex-1">
                <p className="text-text-main text-sm font-semibold mb-1">Excellent Range</p>
                <p className="text-text-muted text-xs font-medium">Your cardiovascular efficiency is in the top 15% for your age group.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-panel border border-[#00F0FF]/30 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <Timer size={20} className="text-[#00C2D1]" />
              <span className="text-text-main font-bold">Projected Finish</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border p-4 rounded-xl text-center">
                <p className="text-text-muted text-[10px] uppercase font-bold mb-1">5K Run</p>
                <p className="text-text-main font-black text-xl">22:45</p>
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl text-center">
                <p className="text-text-muted text-[10px] uppercase font-bold mb-1">Half Mara</p>
                <p className="text-text-main font-black text-xl">1:48:12</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Endurance Nutrition */}
      <div className="bg-gradient-to-r from-surface to-panel border border-[#00F0FF]/30 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 flex items-center justify-center flex-shrink-0">
          <Heart size={32} className="text-[#00C2D1]" />
        </div>
        <div className="flex-1">
          <h4 className="text-text-main font-bold text-lg mb-1">The Glycogen Factor</h4>
          <p className="text-text-muted text-sm font-medium">
            Endurance requires sustained energy. Increase complex carb intake (Sweet Potatoes/Brown Rice) and ensure adequate sodium/potassium balance.
          </p>
        </div>
        <button className="px-6 py-3 border border-[#00C2D1]/30 text-[#008A96] font-bold rounded-xl hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2 shadow-sm">
          Endurance Fuel Plan <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
