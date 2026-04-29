import { useState } from 'react';
import { Smile, Frown, Meh, Zap, Moon, Wind, HeartPulse } from 'lucide-react';

interface Props {
  onMoodChange: (data: MoodData) => void;
}

export interface MoodData {
  stress: number; // 0-100
  mood: 'low' | 'neutral' | 'high';
  hrv: number;
  sleepScore: number;
}

export default function MoodStressCheck({ onMoodChange }: Props) {
  const [stress, setStress] = useState(30);
  const [selectedMood, setSelectedMood] = useState<'low' | 'neutral' | 'high'>('neutral');

  const updateMood = (mood: 'low' | 'neutral' | 'high', newStress: number) => {
    setSelectedMood(mood);
    setStress(newStress);
    onMoodChange({
      stress: newStress,
      mood,
      hrv: 100 - newStress,
      sleepScore: 85 - (newStress / 2)
    });
  };

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#FF3131]" />
            Aura Mood Sync
          </h3>
          <p className="text-[#6b7280] text-sm">Mental-Physical synergy analysis</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider mb-4">How are you feeling?</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'low', icon: Frown, label: 'Low', color: '#FF3131' },
              { id: 'neutral', icon: Meh, label: 'Neutral', color: '#FFBD59' },
              { id: 'high', icon: Smile, label: 'High', color: '#10b981' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => updateMood(m.id as any, stress)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  selectedMood === m.id 
                    ? 'bg-[#0a0a0a]' 
                    : 'bg-[#0a0a0a] border-[#1f1f1f] grayscale opacity-50'
                }`}
                style={selectedMood === m.id ? { 
                  borderColor: m.color,
                  boxShadow: `0 0 15px ${m.color}20`
                } : {}}
              >
                <m.icon className="w-6 h-6" style={{ color: selectedMood === m.id ? m.color : '#4b5563' }} />
                <span className="text-[10px] font-bold uppercase">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[#9ca3af] text-xs font-medium">Stress Level</span>
            <span className="text-white text-xs font-bold">{stress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={stress}
            onChange={(e) => updateMood(selectedMood, parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-[#FF3131]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#38B6FF]/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-[#38B6FF]" />
            </div>
            <div>
              <p className="text-[#6b7280] text-[9px] uppercase font-bold">Sleep Quality</p>
              <p className="text-white text-sm font-black">{85 - Math.floor(stress/3)}%</p>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
              <Wind className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <p className="text-[#6b7280] text-[9px] uppercase font-bold">HRV Index</p>
              <p className="text-white text-sm font-black">{100 - stress} ms</p>
            </div>
          </div>
        </div>

        {stress > 70 && (
          <div className="bg-[#FF3131]/10 border border-[#FF3131]/20 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#FF3131]" />
              <span className="text-white text-xs font-bold uppercase">AI Coach Recommendation</span>
            </div>
            <p className="text-[#FF3131] text-[11px] leading-relaxed">
              Your stress levels are high. Switched Workout Mode to <strong className="uppercase">Flow</strong>. 
              Suggesting a 5-minute breathing exercise before starting.
            </p>
            <button className="mt-3 w-full py-2 bg-[#FF3131] text-white text-[10px] font-black uppercase rounded-lg shadow-lg">
              Start De-stress Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
