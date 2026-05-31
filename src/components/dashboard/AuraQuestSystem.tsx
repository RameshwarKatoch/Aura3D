import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, CheckCircle2, AlertTriangle, Trophy, ChevronDown,
  ChevronUp, Droplets, Footprints, Zap, Dumbbell, Target,
  Beef, Plus, RotateCcw, Lock, Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestCategory = 'steps' | 'water' | 'protein' | 'calories' | 'exercise';
type QuestStatus = 'pending' | 'done' | 'failed';

interface DayQuest {
  id: QuestCategory;
  label: string;
  target: number;
  unit: string;
  current: number;
  status: QuestStatus;
  icon: string;
  color: string;
}

interface DayRecord {
  day: number;
  date: string;
  quests: DayQuest[];
  compensationTasks?: DayQuest[];
  compensationDone?: boolean;
  claimed: boolean;
}

interface AuraQuestSystemProps {
  profile: UserProfile;
}

// ─── Quest Target Scaling ─────────────────────────────────────────────────────

function getTargetsForDay(day: number, profile: UserProfile) {
  const d = Math.max(1, day);
  return {
    steps:    Math.min(18000, 4000 + d * 250),
    water:    Math.min(4.5,   parseFloat((1.5 + d * 0.05).toFixed(1))),
    protein:  Math.min(Math.round(profile.weight_kg * 2.2), Math.round(profile.weight_kg * (0.8 + d * 0.025))),
    calories: Math.min(900,   150 + d * 20),
    exercise: Math.min(90,    10  + d * 2),
  };
}

function buildQuests(day: number, profile: UserProfile, saved: Partial<Record<QuestCategory, number>>): DayQuest[] {
  const t = getTargetsForDay(day, profile);
  return [
    { id: 'steps',    label: `Walk ${t.steps.toLocaleString()} Steps`,      target: t.steps,    unit: 'steps', current: saved.steps ?? 0,    status: 'pending', icon: '👣', color: '#f59e0b' },
    { id: 'water',    label: `Drink ${t.water}L Water`,                     target: t.water,    unit: 'L',     current: saved.water ?? 0,    status: 'pending', icon: '💧', color: '#3b82f6' },
    { id: 'protein',  label: `Eat ${t.protein}g Protein`,                   target: t.protein,  unit: 'g',     current: saved.protein ?? 0,  status: 'pending', icon: '🥩', color: '#8b5cf6' },
    { id: 'calories', label: `Burn ${t.calories} kcal (Exercise)`,          target: t.calories, unit: 'kcal',  current: saved.calories ?? 0, status: 'pending', icon: '🔥', color: '#ef4444' },
    { id: 'exercise', label: `Exercise for ${t.exercise} minutes`,          target: t.exercise, unit: 'min',   current: saved.exercise ?? 0, status: 'pending', icon: '💪', color: '#10b981' },
  ];
}

function buildCompensationTasks(failed: DayQuest[], prevDay: number, profile: UserProfile): DayQuest[] {
  const t = getTargetsForDay(prevDay, profile);
  return failed.map(q => ({
    ...q,
    id: q.id,
    label: `[MAKEUP] ${q.label} +50%`,
    target: parseFloat((q.target * 1.5).toFixed(1)),
    current: 0,
    status: 'pending' as QuestStatus,
    color: '#f97316',
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'aura_quest_system_v2';
const today = () => new Date().toISOString().split('T')[0];

function loadData(): { days: DayRecord[]; startDate: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { days: [], startDate: today() };
}

function saveData(data: { days: DayRecord[]; startDate: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentDay(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return diff + 1;
}

// ─── Step / quick-add increments per category ─────────────────────────────────

const QUICK_ADDS: Record<QuestCategory, number[]> = {
  steps:    [500, 1000, 2000, 5000],
  water:    [0.25, 0.5, 1],
  protein:  [10, 20, 30, 50],
  calories: [50, 100, 200],
  exercise: [5, 10, 15, 30],
};

const CATEGORY_ICONS: Record<QuestCategory, React.ReactNode> = {
  steps:    <Footprints size={16} />,
  water:    <Droplets   size={16} />,
  protein:  <Beef       size={16} />,
  calories: <Flame      size={16} />,
  exercise: <Dumbbell   size={16} />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestRow({ quest, onAdd, isCompensation = false }: {
  quest: DayQuest;
  onAdd: (id: QuestCategory, amount: number) => void;
  isCompensation?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [custom, setCustom] = useState('');
  const pct = Math.min(100, (quest.current / quest.target) * 100);
  const isDone = quest.current >= quest.target;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isDone
          ? 'border-green-500/30 bg-green-500/5'
          : isCompensation
          ? 'border-orange-500/30 bg-orange-500/5'
          : 'border-border bg-surface'
      }`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => !isDone && setExpanded(e => !e)}
      >
        <span className="text-xl w-6 text-center flex-shrink-0">{quest.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isDone ? 'text-green-600' : isCompensation ? 'text-orange-600' : 'text-text-main'}`}>
            {quest.label}
          </p>
          <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', damping: 20 }}
              className="h-full rounded-full"
              style={{ backgroundColor: isDone ? '#22c55e' : isCompensation ? '#f97316' : quest.color }}
            />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-xs font-mono font-bold ${isDone ? 'text-green-600' : 'text-text-main'}`}>
            {typeof quest.current === 'number' && quest.unit === 'L'
              ? quest.current.toFixed(2)
              : Math.round(quest.current)}/{quest.target}{quest.unit !== 'steps' ? quest.unit : ''}
          </p>
          {!isDone && (
            <p className="text-[10px] text-text-muted">
              {quest.unit === 'L'
                ? `${(quest.target - quest.current).toFixed(2)}L left`
                : `${Math.round(quest.target - quest.current)} left`}
            </p>
          )}
        </div>
        {!isDone && (
          <div className="text-text-muted">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
        {isDone && <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />}
      </div>

      <AnimatePresence>
        {expanded && !isDone && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border p-3 space-y-2"
          >
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_ADDS[quest.id].map(amt => (
                <button
                  key={amt}
                  onClick={() => onAdd(quest.id, amt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95"
                  style={{
                    backgroundColor: `${quest.color}15`,
                    borderColor: `${quest.color}40`,
                    color: quest.color,
                  }}
                >
                  +{amt}{quest.unit !== 'steps' ? quest.unit : ''}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && custom) { onAdd(quest.id, parseFloat(custom)); setCustom(''); } }}
                placeholder={`Custom ${quest.unit}`}
                className="flex-1 bg-surface border border-border focus:border-primary/50 rounded-lg px-3 py-1.5 text-text-main text-xs outline-none placeholder-text-muted"
              />
              <button
                onClick={() => { if (custom) { onAdd(quest.id, parseFloat(custom)); setCustom(''); } }}
                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors active:scale-95"
                style={{ backgroundColor: quest.color }}
              >
                <Plus size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuraQuestSystem({ profile }: AuraQuestSystemProps) {
  const [data, setData] = useState(() => loadData());
  const [showHistory, setShowHistory] = useState(false);

  const currentDay = getCurrentDay(data.startDate);
  const todayDate = today();

  // Find or create today's record
  const todayRecord = data.days.find(d => d.date === todayDate);

  // Previous record (for compensation check)
  const prevRecord = data.days.find(d => d.day === currentDay - 1);
  const hasPendingCompensation = prevRecord && !prevRecord.compensationDone &&
    prevRecord.quests.some(q => q.current < q.target);

  // Initialize today's record on first load
  useEffect(() => {
    if (!todayRecord) {
      const prevSaved: Partial<Record<QuestCategory, number>> = {};
      const newQuests = buildQuests(currentDay, profile, prevSaved);

      // Check if previous day had failures and generate compensation
      let compensationTasks: DayQuest[] | undefined;
      if (prevRecord) {
        const failed = prevRecord.quests.filter(q => q.current < q.target);
        if (failed.length > 0) {
          compensationTasks = buildCompensationTasks(failed, currentDay - 1, profile);
        }
      }

      const newRecord: DayRecord = {
        day: currentDay,
        date: todayDate,
        quests: newQuests,
        compensationTasks,
        compensationDone: !compensationTasks,
        claimed: false,
      };

      setData(prev => {
        const updated = { ...prev, days: [...prev.days, newRecord] };
        saveData(updated);
        return updated;
      });
    }
  }, [currentDay, todayDate]);

  const updateProgress = useCallback((id: QuestCategory, amount: number, isCompensation = false) => {
    setData(prev => {
      const updated = { ...prev };
      updated.days = prev.days.map(d => {
        if (d.date !== todayDate) return d;
        if (isCompensation) {
          const tasks = (d.compensationTasks ?? []).map(q => {
            if (q.id !== id) return q;
            const newCurrent = Math.max(0, Math.min(q.target, parseFloat((q.current + amount).toFixed(2))));
            return { ...q, current: newCurrent, status: newCurrent >= q.target ? 'done' as QuestStatus : 'pending' as QuestStatus };
          });
          const allCompDone = tasks.every(t => t.current >= t.target);
          return { ...d, compensationTasks: tasks, compensationDone: allCompDone };
        } else {
          const quests = d.quests.map(q => {
            if (q.id !== id) return q;
            const newCurrent = Math.max(0, Math.min(q.target * 1.5, parseFloat((q.current + amount).toFixed(2))));
            return { ...q, current: newCurrent };
          });
          return { ...d, quests };
        }
      });
      saveData(updated);
      return updated;
    });
  }, [todayDate]);

  const handleClaim = () => {
    setData(prev => {
      const updated = {
        ...prev,
        days: prev.days.map(d =>
          d.date === todayDate ? { ...d, claimed: true } : d
        )
      };
      saveData(updated);
      return updated;
    });
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#2D5BFF', '#f97316', '#FDB913'] });
  };

  const handleReset = () => {
    if (!confirm('Reset your entire journey? This cannot be undone.')) return;
    const fresh = { days: [], startDate: today() };
    saveData(fresh);
    setData(fresh);
  };

  if (!todayRecord) {
    return (
      <div className="bg-panel border border-border rounded-2xl p-8 flex items-center justify-center shadow-sm">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allMainDone = todayRecord.quests.every(q => q.current >= q.target);
  const compDone = todayRecord.compensationDone ?? true;
  const canClaim = allMainDone && compDone && !todayRecord.claimed;
  const totalDone = todayRecord.quests.filter(q => q.current >= q.target).length;

  return (
    <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-surface to-panel border-b border-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Target size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-text-main font-black text-lg flex items-center gap-2">
                Aura Journey
                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">
                  Day {currentDay}
                </span>
              </h2>
              <p className="text-text-muted text-[11px] uppercase tracking-widest font-semibold">
                {totalDone}/{todayRecord.quests.length} quests done today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak flame */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame size={14} className="text-orange-500" fill="currentColor" />
              <span className="text-orange-600 font-bold text-sm">{Math.max(0, currentDay - 1)}d</span>
            </div>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-red-600 transition-colors hover:bg-red-50"
              title="Reset journey"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4 h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(totalDone / todayRecord.quests.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Compensation Tasks — shown before main quests if pending */}
        {todayRecord.compensationTasks && !todayRecord.compensationDone && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              <p className="text-orange-600 font-bold text-sm">Makeup Tasks — Complete to Unlock Today</p>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 text-xs text-orange-700 font-medium mb-2">
              ⚠️ You missed quests yesterday. Complete these compensation tasks first to unlock today's quests.
            </div>
            {todayRecord.compensationTasks.map(q => (
              <QuestRow key={`comp-${q.id}`} quest={q} onAdd={(id, amt) => updateProgress(id, amt, true)} isCompensation />
            ))}
          </div>
        )}

        {/* Main Quests — locked if compensation pending */}
        <div className="space-y-2.5">
          {(!todayRecord.compensationTasks || todayRecord.compensationDone) ? (
            todayRecord.quests.map(q => (
              <QuestRow key={q.id} quest={q} onAdd={(id, amt) => updateProgress(id, amt, false)} />
            ))
          ) : (
            <div className="border border-border rounded-xl p-6 flex flex-col items-center gap-3 text-center opacity-70">
              <Lock size={28} className="text-text-muted" />
              <p className="text-text-main text-sm font-bold">Today's quests are locked</p>
              <p className="text-text-muted text-xs">Complete your makeup tasks above to unlock them</p>
            </div>
          )}
        </div>

        {/* Claim Banner */}
        {canClaim && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-primary/20 to-[#FDB913]/20 border border-primary/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Star size={20} className="text-[#FDB913]" fill="currentColor" />
              <div>
                <p className="text-text-main font-bold text-sm">All Quests Complete!</p>
                <p className="text-text-muted text-xs">Claim your Day {currentDay} reward</p>
              </div>
            </div>
            <button
              onClick={handleClaim}
              className="bg-[#FDB913] text-black font-black text-sm px-5 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Claim 🎉
            </button>
          </motion.div>
        )}

        {todayRecord.claimed && (
          <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-4 text-center">
            <p className="text-green-600 font-bold text-sm">✅ Day {currentDay} Complete! See you tomorrow.</p>
          </div>
        )}

        {/* History toggle */}
        <button
          onClick={() => setShowHistory(p => !p)}
          className="w-full flex items-center justify-between py-2 text-text-muted hover:text-text-main transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <span>Journey History ({data.days.length} days)</span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {[...data.days].reverse().map(d => {
                const done = d.quests.filter(q => q.current >= q.target).length;
                const total = d.quests.length;
                const failed = total - done;
                const isToday = d.date === todayDate;
                return (
                  <div key={d.date} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${isToday ? 'border-primary/30 bg-primary/5' : failed === 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${isToday ? 'text-primary' : failed === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Day {d.day}
                      </span>
                      <span className="text-text-muted">{d.date}</span>
                      {isToday && <span className="text-primary font-bold">(Today)</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={failed === 0 ? 'text-green-600' : 'text-red-600'}>
                        {done}/{total} {failed === 0 ? '✅' : `(${failed} failed)`}
                      </span>
                      {d.claimed && <Trophy size={12} className="text-[#FDB913]" />}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
