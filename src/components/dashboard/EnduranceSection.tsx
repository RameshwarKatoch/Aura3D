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
        className="bg-[#0f172a] border border-[#00F0FF]/20 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
              <Activity size={20} className="text-[#00F0FF]" />
            </div>
            <div>
              <h3 className="text-white font-bold">Cardio Tracker</h3>
              <p className="text-[#00F0FF]/60 text-[10px] uppercase tracking-widest font-black">Log Your Session</p>
            </div>
          </div>
          <div className="flex bg-[#1e293b] rounded-lg p-1">
            <button onClick={() => setCardioMode('running')} className={`p-2 rounded-md transition-colors ${cardioMode === 'running' ? 'bg-[#00F0FF] text-black' : 'text-[#64748b] hover:text-white'}`}>
              <Route size={16} />
            </button>
            <button onClick={() => setCardioMode('cycling')} className={`p-2 rounded-md transition-colors ${cardioMode === 'cycling' ? 'bg-[#00F0FF] text-black' : 'text-[#64748b] hover:text-white'}`}>
              <Bike size={16} />
            </button>
            <button onClick={() => setCardioMode('swimming')} className={`p-2 rounded-md transition-colors ${cardioMode === 'swimming' ? 'bg-[#00F0FF] text-black' : 'text-[#64748b] hover:text-white'}`}>
              <Waves size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[#64748b] text-[10px] uppercase font-bold mb-2">
              {cardioMode === 'swimming' ? 'Laps' : 'Distance (km)'}
            </label>
            <input 
              type="number" 
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:border-[#00F0FF]/50 transition-colors outline-none"
            />
          </div>
          <div>
            <label className="block text-[#64748b] text-[10px] uppercase font-bold mb-2">Time (minutes)</label>
            <input 
              type="number" 
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:border-[#00F0FF]/50 transition-colors outline-none"
            />
          </div>
          <AnimatePresence mode="popLayout">
            {cardioMode === 'cycling' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <label className="block text-[#64748b] text-[10px] uppercase font-bold mb-2">Elevation (m)</label>
                <input 
                  type="number" 
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:border-[#00F0FF]/50 transition-colors outline-none"
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
                 <div className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-[#64748b] text-xs font-bold uppercase tracking-wider">Avg Pace</span>
                    <span className="text-white font-black text-sm">{(time / (distance || 1)).toFixed(2)} {cardioMode === 'swimming' ? 'min/lap' : 'min/km'}</span>
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
          className="bg-[#0f172a] border border-[#00F0FF]/20 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
              <Heart size={20} className="text-[#00F0FF]" />
            </div>
            <div>
              <h3 className="text-white font-bold">Heart Rate Zones</h3>
              <p className="text-[#00F0FF]/60 text-[10px] uppercase tracking-widest font-black">Understand Your Effort</p>
            </div>
          </div>

          <div className="space-y-4">
            {hrZones.map((zone, i) => {
              const isActive = hr >= parseInt(zone.range.split('-')[0]) && (zone.range.includes('+') || hr <= parseInt(zone.range.split('-')[1]));
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 border border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'opacity-40'}`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-4 rounded-full ${zone.color}`} />
                      <span className="text-white text-sm font-bold">{zone.label}</span>
                    </div>
                    <span className="text-[#64748b] text-[10px] pl-4">{zone.desc}</span>
                  </div>
                  <span className="text-[#64748b] text-xs font-mono font-bold">{zone.range} BPM</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-[#1e293b] p-4 rounded-xl">
            <label className="block text-[#64748b] text-[10px] uppercase font-bold mb-3 text-center">Interactive HR Simulator</label>
            <input 
              type="range" 
              min="100" 
              max="190" 
              value={hr}
              onChange={(e) => setHr(Number(e.target.value))}
              className="w-full accent-[#00F0FF]"
            />
            <p className="text-center text-white font-black mt-2">{hr} BPM</p>
          </div>
        </motion.div>

        {/* VO2 Max & Performance */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0f172a] border border-[#00F0FF]/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Wind size={20} className="text-[#00F0FF]" />
                <span className="text-white font-bold">VO2 Max Estimate</span>
              </div>
              <span className="px-2 py-1 rounded bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] font-black uppercase">Aerobic Power</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251} strokeDashoffset={251 - (estimatedVO2 / 60) * 251} className="text-[#00F0FF] transition-all duration-1000" />
                </svg>
                <span className="absolute text-2xl font-black text-white">{estimatedVO2}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">Excellent Range</p>
                <p className="text-[#64748b] text-xs">Your cardiovascular efficiency is in the top 15% for your age group.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0f172a] border border-[#00F0FF]/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Timer size={20} className="text-[#00F0FF]" />
              <span className="text-white font-bold">Projected Finish</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <p className="text-[#64748b] text-[10px] uppercase font-bold mb-1">5K Run</p>
                <p className="text-white font-black text-xl">22:45</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <p className="text-[#64748b] text-[10px] uppercase font-bold mb-1">Half Mara</p>
                <p className="text-white font-black text-xl">1:48:12</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Endurance Nutrition */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-[#00F0FF]/20 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Heart size={32} className="text-[#00F0FF]" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-bold text-lg mb-1">The Glycogen Factor</h4>
          <p className="text-[#64748b] text-sm">
            Endurance requires sustained energy. Increase complex carb intake (Sweet Potatoes/Brown Rice) and ensure adequate sodium/potassium balance.
          </p>
        </div>
        <button className="px-6 py-3 border border-[#00F0FF]/30 text-[#00F0FF] font-bold rounded-xl hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2">
          Endurance Fuel Plan <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
