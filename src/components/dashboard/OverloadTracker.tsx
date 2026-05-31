import { useState, useEffect } from 'react';
import { Trophy, Plus, ChevronDown, ChevronUp, Dumbbell, Flame } from 'lucide-react';
import type { WorkoutSet, MuscleGroupName } from '../../types';

const EXERCISES: { name: string; muscle: MuscleGroupName }[] = [
  { name: 'Bench Press', muscle: 'Chest' },
  { name: 'Push-ups', muscle: 'Chest' },
  { name: 'Dumbbell Flyes', muscle: 'Chest' },
  { name: 'Barbell Squat', muscle: 'Quads' },
  { name: 'Leg Press', muscle: 'Quads' },
  { name: 'Leg Extensions', muscle: 'Quads' },
  { name: 'Barbell Curl', muscle: 'Biceps' },
  { name: 'Preacher Curl', muscle: 'Biceps' },
  { name: 'Deadlift', muscle: 'Back' },
  { name: 'Pull-ups', muscle: 'Back' },
  { name: 'Lat Pulldown', muscle: 'Lats' },
  { name: 'Seated Cable Row', muscle: 'Back' },
  { name: 'Overhead Press', muscle: 'Shoulders' },
  { name: 'Lateral Raises', muscle: 'Shoulders' },
  { name: 'Face Pulls', muscle: 'Traps' },
  { name: 'Stiff-leg Deadlift', muscle: 'Hamstrings' },
  { name: 'Leg Curls', muscle: 'Hamstrings' },
  { name: 'Tricep Pushdown', muscle: 'Triceps' },
  { name: 'Skull Crushers', muscle: 'Triceps' },
  { name: 'Barbell Shrugs', muscle: 'Traps' },
  { name: 'Calf Raises', muscle: 'Calves' },
  { name: 'Hip Thrusts', muscle: 'Glutes' },
  { name: 'Glute Kickbacks', muscle: 'Glutes' },
  { name: 'Hanging Leg Raises', muscle: 'Abs' },
  { name: 'Crunches', muscle: 'Abs' },
  { name: 'Wrist Curls', muscle: 'Forearms' },
  { name: 'Farmer Walk', muscle: 'Forearms' },
  { name: 'Plank', muscle: 'Core' },
];

const STORAGE_KEY = 'aura3d_workout_logs';

function getColor(muscle: MuscleGroupName): string {
  const map: Record<MuscleGroupName, string> = {
    Chest: '#0070FF', Quads: '#8b5cf6', Biceps: '#06b6d4',
    Back: '#10b981', Shoulders: '#f59e0b', Hamstrings: '#ef4444',
    Triceps: '#ec4899', Core: '#f97316', Abs: '#f97316',
    Glutes: '#ef4444', Calves: '#8b5cf6', Forearms: '#06b6d4',
    Lats: '#10b981', Traps: '#f59e0b',
  };
  return map[muscle] ?? '#0070FF';
}

interface Props {
  onSetsUpdate: (sets: WorkoutSet[]) => void;
}

export default function OverloadTracker({ onSetsUpdate }: Props) {
  const [allSets, setAllSets] = useState<WorkoutSet[]>([]);
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].name);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [prFlash, setPrFlash] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: WorkoutSet[] = JSON.parse(raw);
      setAllSets(parsed);
      onSetsUpdate(parsed);
    }
  }, []);

  const getPR = (exerciseName: string): WorkoutSet | undefined => {
    return allSets
      .filter(s => s.exercise === exerciseName)
      .sort((a, b) => b.weight * b.reps - a.weight * a.reps)[0];
  };

  const handleLog = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (!w || !r || w <= 0 || r <= 0) return;

    const ex = EXERCISES.find(e => e.name === selectedExercise)!;
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exercise: selectedExercise,
      muscleGroup: ex.muscle,
      weight: w,
      reps: r,
      timestamp: Date.now(),
    };

    const pr = getPR(selectedExercise);
    const isNewPR = !pr || w * r > pr.weight * pr.reps;

    const updated = [newSet, ...allSets];
    setAllSets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    onSetsUpdate(updated);

    if (isNewPR) {
      setPrFlash(selectedExercise);
      setTimeout(() => setPrFlash(null), 3000);
    }

    setWeight('');
    setReps('');
  };

  // Today's sets only
  const todaySets = allSets.filter(s => {
    const d = new Date(s.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const exerciseColor = getColor(
    EXERCISES.find(e => e.name === selectedExercise)?.muscle ?? 'Chest'
  );

  return (
    <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-6 hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Dumbbell size={16} className="text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-text-main font-semibold text-sm">Progress Overload Tracker</h3>
            <p className="text-text-muted text-xs">{todaySets.length} sets logged today</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-5">
          {/* PR Flash Banner */}
          {prFlash && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 animate-pulse">
              <Trophy size={18} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-yellow-700 text-sm font-bold">🏆 New Personal Record!</p>
                <p className="text-yellow-600 text-xs font-semibold">{prFlash} — your best yet!</p>
              </div>
            </div>
          )}

          {/* Log Form */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1.5">Exercise</label>
              <select
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                {EXERCISES.map(ex => (
                  <option key={ex.name} value={ex.name} className="bg-surface text-text-main">
                    {ex.name} ({ex.muscle})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1.5">Reps</label>
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLog()}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleLog}
              style={{ backgroundColor: exerciseColor }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
            >
              <Plus size={16} />
              Log Set
            </button>
          </div>

          {/* Today's Sets */}
          {todaySets.length > 0 && (
            <div>
              <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Today's Logged Sets</h4>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {todaySets.map(s => {
                  const pr = getPR(s.exercise);
                  const isCurrentPR = pr?.id === s.id;
                  const color = getColor(s.muscleGroup);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <p className="text-text-main text-sm font-semibold">{s.exercise}</p>
                          <p className="text-text-muted text-xs font-medium">{s.muscleGroup}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-main text-sm font-bold">{s.weight}kg × {s.reps}</span>
                        {isCurrentPR && <Trophy size={14} className="text-yellow-500" />}
                        {!isCurrentPR && s.weight > 0 && <Flame size={14} className="text-orange-500 opacity-60" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
