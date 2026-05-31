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
    <div className="bg-panel border border-border rounded-2xl p-6 h-full shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-text-main font-bold text-lg flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-500" />
            Aura Mood Sync
          </h3>
          <p className="text-text-muted text-sm">Mental-Physical synergy analysis</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">How are you feeling?</p>
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
                    ? 'bg-surface border-primary text-text-main' 
                    : 'bg-surface border-border text-text-muted grayscale opacity-50'
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
            <span className="text-text-muted text-xs font-semibold">Stress Level</span>
            <span className="text-text-main text-xs font-bold">{stress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={stress}
            onChange={(e) => updateMood(selectedMood, parseInt(e.target.value))}
            className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-text-muted text-[9px] uppercase font-bold">Sleep Quality</p>
              <p className="text-text-main text-sm font-black">{85 - Math.floor(stress/3)}%</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Wind className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-text-muted text-[9px] uppercase font-bold">HRV Index</p>
              <p className="text-text-main text-sm font-black">{100 - stress} ms</p>
            </div>
          </div>
        </div>

        {stress > 70 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-xs font-bold uppercase">AI Coach Recommendation</span>
            </div>
            <p className="text-red-600 text-[11px] font-medium leading-relaxed">
              Your stress levels are high. Switched Workout Mode to <strong className="uppercase font-semibold">Flow</strong>. 
              Suggesting a 5-minute breathing exercise before starting.
            </p>
            <button className="mt-3 w-full py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-red-600 active:scale-95 transition-all">
              Start De-stress Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
