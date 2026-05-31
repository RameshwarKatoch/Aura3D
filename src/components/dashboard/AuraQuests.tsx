import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Flame, Award, Plus, Minus, Beef } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Quest } from '../../types';

interface AuraQuestsProps {
  quests: Quest[];
  credits: number;
  streak: number;
  activeSkin: string;
  onSkinChange: (skin: string) => void;
  onQuestClick?: (questId: string) => void;
  onProteinLog?: (grams: number) => void;
  onClaim?: () => void;
}

const QUICK_ADDS = [10, 20, 30, 50];

export default function AuraQuests({ quests, credits, streak, activeSkin, onSkinChange, onQuestClick, onProteinLog, onClaim }: AuraQuestsProps) {
  const allCompleted = quests.every(q => q.completed);
  const [customProtein, setCustomProtein] = useState('');
  const [showProteinInput, setShowProteinInput] = useState(false);

  const proteinQuest = quests.find(q => q.id === 'protein');

  const handleClaim = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2D5BFF', '#38B6FF', '#FDB913']
    });
    if (onClaim) onClaim();
  };

  const handleQuickAdd = (g: number) => {
    if (onProteinLog) onProteinLog(g);
  };

  const handleCustomAdd = () => {
    const val = parseFloat(customProtein);
    if (!isNaN(val) && val > 0 && onProteinLog) {
      onProteinLog(val);
      setCustomProtein('');
    }
  };

  const handleReset = () => {
    if (onProteinLog && proteinQuest) {
      onProteinLog(-(proteinQuest.current as number));
    }
  };

  return (
    <div className="bg-panel border border-border rounded-2xl p-6 h-full flex flex-col shadow-sm" role="region" aria-label="Aura Quests and Rewards">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-text-main font-bold text-lg flex items-center gap-2">
            Aura Quests
            {streak > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full border border-red-500/30 font-bold">
                Lvl {streak} Overload
              </span>
            )}
          </h3>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1 font-semibold">
            {streak > 0 ? `${(Math.min(2.0, 1 + (streak * 0.1)) * 100 - 100).toFixed(0)}% Harder Targets` : 'Daily Challenges'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30">
          <motion.div
            animate={{ 
              filter: streak > 0 ? ['drop-shadow(0 0 2px #f97316)', 'drop-shadow(0 0 8px #f97316)', 'drop-shadow(0 0 2px #f97316)'] : 'none'
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame size={16} className={streak > 0 ? 'text-orange-500' : 'text-text-muted'} fill={streak > 0 ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-text-main font-bold text-sm">{streak}d Streak</span>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {quests.map(quest => (
          <div key={quest.id}>
            {/* Quest Row */}
            <div
              onClick={() => {
                if (quest.id === 'protein') {
                  setShowProteinInput(p => !p);
                } else {
                  onQuestClick && onQuestClick(quest.id);
                }
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:bg-gray-100 hover:scale-[1.01] ${quest.completed ? 'bg-green-500/5 border-green-500/30' : 'bg-surface border-border'}`}
              title={quest.id === 'protein' ? 'Click to log protein' : 'Click to log progress'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {quest.completed ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <Circle size={20} className="text-text-muted" />
                  )}
                  <span className={`text-sm font-semibold ${quest.completed ? 'text-green-600' : 'text-text-main'}`}>{quest.label}</span>
                  {quest.id === 'protein' && (
                    <Beef size={14} className="text-blue-500" />
                  )}
                </div>
                <span className="text-xs text-text-muted font-mono font-bold">
                  {typeof quest.current === 'number' ? Math.round(quest.current as number) : quest.current}
                  {quest.id === 'protein' ? 'g' : ''}/{quest.target}{quest.id === 'protein' ? 'g' : ''}
                </span>
              </div>
              {!quest.completed && (
                <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${quest.id === 'protein' ? 'bg-blue-500' : 'bg-blue-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((quest.current as number) / (quest.target as number)) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Inline Protein Logger — expands when protein quest is clicked */}
            {quest.id === 'protein' && showProteinInput && !quest.completed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-surface border border-blue-500/20 rounded-xl p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-blue-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Beef size={12} /> Log Protein
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="text-text-muted hover:text-red-500 text-[10px] font-bold uppercase transition-colors"
                  >
                    Reset Today
                  </button>
                </div>

                {/* Current total display */}
                <div className="text-center py-2">
                  <span className="text-4xl font-black text-text-main tabular-nums">
                    {Math.round((proteinQuest?.current as number) ?? 0)}
                  </span>
                  <span className="text-text-muted text-lg font-bold">g</span>
                  <p className="text-text-muted text-[10px] mt-1 uppercase tracking-widest font-semibold">
                    {Math.max(0, Math.round(((proteinQuest?.target as number) ?? 0) - ((proteinQuest?.current as number) ?? 0)))}g to go
                  </p>
                </div>

                {/* Quick add buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_ADDS.map(g => (
                    <button
                      key={g}
                      onClick={(e) => { e.stopPropagation(); handleQuickAdd(g); }}
                      className="bg-blue-500/10 hover:bg-blue-500/25 text-blue-500 font-bold text-sm py-2 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all active:scale-95"
                    >
                      +{g}g
                    </button>
                  ))}
                </div>

                {/* Custom input row */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={customProtein}
                      onChange={e => setCustomProtein(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
                      placeholder="Custom amount"
                      className="w-full bg-surface border border-border focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-text-main text-sm placeholder-text-muted outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-bold">g</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCustomAdd(); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 rounded-xl transition-colors active:scale-95 flex items-center gap-1"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (onProteinLog) onProteinLog(-10); }}
                    className="bg-border hover:bg-red-500/20 hover:text-red-500 text-text-muted font-bold px-3 rounded-xl transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Completed state */}
            {quest.id === 'protein' && quest.completed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-green-600 text-xs font-bold py-1"
              >
                🎉 Protein goal crushed! +50 Aura credits
              </motion.p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#FDB913]" />
            <span className="text-text-main font-bold">{credits}</span>
            <span className="text-text-muted text-xs uppercase font-semibold">Credits</span>
          </div>
          <button
            onClick={handleClaim}
            disabled={!allCompleted}
            aria-label="Claim daily quest bonus"
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm ${allCompleted ? 'bg-[#FDB913] text-black hover:scale-105' : 'bg-surface border border-border text-text-muted cursor-not-allowed'}`}
          >
            Claim Daily Bonus
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSkinChange('blue')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${activeSkin === 'blue' ? 'border-[#38B6FF] bg-[#38B6FF]/10 text-[#38B6FF]' : 'border-border bg-surface text-text-muted hover:bg-border'}`}
          >
            <div className="w-2 h-2 rounded-full bg-[#38B6FF]" />
            Classic Blue
          </button>
          <button
            onClick={() => onSkinChange('gold')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${activeSkin === 'gold' ? 'border-[#FDB913] bg-[#FDB913]/10 text-[#FDB913]' : 'border-border bg-surface text-text-muted hover:bg-border'}`}
          >
            <div className="w-2 h-2 rounded-full bg-[#FDB913]" />
            Gold Edition
          </button>
        </div>
      </div>
    </div>
  );
}
