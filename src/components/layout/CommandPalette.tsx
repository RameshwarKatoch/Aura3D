import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, LayoutDashboard, Utensils, PersonStanding, User,
  Zap, Timer, Bed, Droplets, Footprints, Moon, Play,
} from 'lucide-react';
import type { AppView, TrainingMode } from '../../types';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string;
}

interface Props {
  onNavigate: (view: AppView) => void;
  onTrainingModeChange: (mode: TrainingMode) => void;
  onLogWater: () => void;
  onLogSteps: () => void;
  onLogSleep: () => void;
  onStartTimer: (secs: number) => void;
}

export default function CommandPalette({
  onNavigate,
  onTrainingModeChange,
  onLogWater,
  onLogSteps,
  onLogSleep,
  onStartTimer,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIdx(0);
  }, []);

  const commands: Command[] = [
    // Navigation
    { id: 'nav-dash', label: 'Go to Dashboard', icon: <LayoutDashboard size={16} />, category: 'Navigate', action: () => { onNavigate('dashboard'); close(); } },
    { id: 'nav-nutr', label: 'Go to Nutrition', icon: <Utensils size={16} />, category: 'Navigate', action: () => { onNavigate('nutrition'); close(); } },
    { id: 'nav-avatar', label: 'Go to Body Avatar', icon: <PersonStanding size={16} />, category: 'Navigate', action: () => { onNavigate('avatar'); close(); } },
    { id: 'nav-profile', label: 'Go to Profile', icon: <User size={16} />, category: 'Navigate', action: () => { onNavigate('profile'); close(); } },
    // Training Mode
    { id: 'mode-power', label: 'Switch to Power Mode', description: '+20% Protein Target', icon: <Zap size={16} className="text-primary" />, category: 'Training Mode', keywords: 'power strength lift', action: () => { onTrainingModeChange('power'); close(); } },
    { id: 'mode-end', label: 'Switch to Endurance Mode', description: 'High Carb · Sustained Energy', icon: <Timer size={16} className="text-emerald-400" />, category: 'Training Mode', keywords: 'endurance cardio run', action: () => { onTrainingModeChange('endurance'); close(); } },
    { id: 'mode-rec', label: 'Switch to Recovery Mode', description: 'Low Intensity · Muscle Repair', icon: <Bed size={16} className="text-purple-400" />, category: 'Training Mode', keywords: 'recovery rest repair', action: () => { onTrainingModeChange('recovery'); close(); } },
    // Log
    { id: 'log-water', label: 'Log Water +0.5L', description: 'Add water intake', icon: <Droplets size={16} className="text-sky-400" />, category: 'Log', keywords: 'water drink hydrate', action: () => { onLogWater(); close(); } },
    { id: 'log-steps', label: 'Log Steps +500', description: 'Add daily steps', icon: <Footprints size={16} className="text-purple-400" />, category: 'Log', keywords: 'steps walk run', action: () => { onLogSteps(); close(); } },
    { id: 'log-sleep', label: 'Log Last Night\'s Sleep', description: 'Update sleep chart', icon: <Moon size={16} className="text-indigo-400" />, category: 'Log', keywords: 'sleep rest bed night', action: () => { onLogSleep(); close(); } },
    // Timer
    { id: 'timer-60', label: 'Start Rest Timer — 1 min', icon: <Play size={16} className="text-green-400" />, category: 'Timer', keywords: 'timer rest 60 one minute', action: () => { onStartTimer(60); close(); } },
    { id: 'timer-90', label: 'Start Rest Timer — 90 sec', icon: <Play size={16} className="text-green-400" />, category: 'Timer', keywords: 'timer rest 90 ninety', action: () => { onStartTimer(90); close(); } },
    { id: 'timer-120', label: 'Start Rest Timer — 2 min', icon: <Play size={16} className="text-green-400" />, category: 'Timer', keywords: 'timer rest 120 two minute', action: () => { onStartTimer(120); close(); } },
  ];

  const filtered = query.trim() === ''
    ? commands
    : commands.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q)
          || c.category.toLowerCase().includes(q)
          || (c.keywords ?? '').toLowerCase().includes(q)
          || (c.description ?? '').toLowerCase().includes(q);
      });

  // Group by category
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  // Global keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (!open) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIdx]?.action();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, selectedIdx, close]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIdx(0);
    }
  }, [open]);

  // Reset selection when query changes
  useEffect(() => setSelectedIdx(0), [query]);

  // Running flat index for keyboard selection
  let flatIdx = 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onMouseDown={e => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Palette */}
      <div className="relative w-full max-w-xl mx-4 bg-panel border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={17} className="text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands, modes, navigate..."
            className="flex-1 bg-transparent text-text-main text-sm placeholder-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-surface border border-border rounded text-[10px] text-text-muted font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-text-muted text-sm">No commands found for "{query}"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category} className="mb-1">
                <div className="px-4 py-1.5">
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                    {category}
                  </span>
                </div>
                {cmds.map(cmd => {
                  const thisIdx = flatIdx++;
                  const isSelected = thisIdx === selectedIdx;
                  return (
                    <button
                      key={cmd.id}
                      onMouseEnter={() => setSelectedIdx(thisIdx)}
                      onClick={cmd.action}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-surface'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary/20' : 'bg-surface'
                      }`}>
                        <span className={isSelected ? 'text-primary' : 'text-text-muted'}>
                          {cmd.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-text-main' : 'text-text-main/80'}`}>
                          {cmd.label}
                        </p>
                        {cmd.description && (
                          <p className="text-text-muted text-xs truncate">{cmd.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-surface border border-border rounded text-[10px] text-text-muted font-mono flex-shrink-0">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4">
          <span className="text-text-muted text-[10px] flex items-center gap-1">
            <kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">↑↓</kbd> navigate
          </span>
          <span className="text-text-muted text-[10px] flex items-center gap-1">
            <kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">↵</kbd> select
          </span>
          <span className="text-text-muted text-[10px] flex items-center gap-1">
            <kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
