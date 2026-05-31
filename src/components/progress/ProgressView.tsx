import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Dumbbell, Plus, TrendingUp, Calendar, Save, Zap, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { UserProfile, WorkoutSet, MuscleGroupName } from '../../types';

interface Props {
  profile: UserProfile;
}

const MUSCLE_GROUPS: MuscleGroupName[] = [
  'Chest', 'Quads', 'Biceps', 'Back', 'Shoulders', 'Hamstrings', 
  'Triceps', 'Core', 'Abs', 'Glutes', 'Calves', 'Forearms', 'Lats', 'Traps'
];

export default function ProgressView({ profile }: Props) {
  const [logs, setLogs] = useState<WorkoutSet[]>([]);
  const [exercise, setExercise] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroupName>('Chest');
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('All');

  const [questLogs, setQuestLogs] = useState<any[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const rawWorkouts = localStorage.getItem('aura3d_workout_logs');
      if (rawWorkouts) {
        setLogs(JSON.parse(rawWorkouts));
      }
      const rawQuests = localStorage.getItem('aura_quest_logs');
      if (rawQuests) {
        setQuestLogs(JSON.parse(rawQuests));
      }
    } catch (e) {
      console.error('Error loading logs', e);
    }
  }, []);

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || weight <= 0 || reps <= 0) return;

    setIsSaving(true);
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exercise,
      muscleGroup,
      weight,
      reps,
      timestamp: Date.now()
    };

    const newLogs = [newSet, ...logs];
    setLogs(newLogs);
    localStorage.setItem('aura3d_workout_logs', JSON.stringify(newLogs));

    // Try to sync to Supabase if user exists
    if (profile.user_id) {
      try {
        await supabase.from('workout_logs').insert({
          user_id: profile.user_id,
          exercise: newSet.exercise,
          muscle_group: newSet.muscleGroup,
          weight: newSet.weight,
          reps: newSet.reps,
          timestamp: new Date(newSet.timestamp).toISOString()
        });
      } catch (err) {
        console.error('Failed to sync log to cloud', err);
      }
    }

    setExercise('');
    setWeight(0);
    setReps(0);
    setIsSaving(false);
  };

  // Group data by Week for Charts
  const weeklyChartData = useMemo(() => {
    const dataByWeek: Record<string, { volume: number, maxWeight: number, dateStr: string, timestamp: number }> = {};
    
    // Filter by selected exercise if not 'All'
    const filteredLogs = selectedExerciseFilter === 'All' 
      ? logs 
      : logs.filter(l => l.exercise.toLowerCase() === selectedExerciseFilter.toLowerCase());

    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp);
      // Group by Week (Sunday start)
      const firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = `${firstDayOfWeek.getFullYear()}-W${Math.ceil((firstDayOfWeek.getDate() - 1 - firstDayOfWeek.getDay()) / 7)}`;
      const dateStr = firstDayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dataByWeek[weekKey]) {
        dataByWeek[weekKey] = { volume: 0, maxWeight: 0, dateStr, timestamp: firstDayOfWeek.getTime() };
      }

      dataByWeek[weekKey].volume += (log.weight * log.reps);
      dataByWeek[weekKey].maxWeight = Math.max(dataByWeek[weekKey].maxWeight, log.weight);
    });

    // Sort chronologically
    return Object.values(dataByWeek).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, selectedExerciseFilter]);

  // Unique exercises for the filter
  const uniqueExercises = useMemo(() => {
    const exercises = new Set(logs.map(l => l.exercise.toLowerCase()));
    return ['All', ...Array.from(exercises)];
  }, [logs]);

  // Key metrics
  const totalVolume = useMemo(() => logs.reduce((acc, l) => acc + (l.weight * l.reps), 0), [logs]);
  const totalSets = logs.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight flex items-center gap-3">
            Progress Tracker
            <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-1 rounded-full tracking-widest border border-primary/20">
              Live Sync
            </span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Log workouts and track your strength trajectory.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Log Form & Summary */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-panel border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-text-main font-bold">Log Workout</h3>
                <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Manual Entry</p>
              </div>
            </div>

            <form onSubmit={handleLogWorkout} className="space-y-4">
              <div>
                <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Exercise Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bench Press"
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary/50 transition-colors outline-none"
                />
              </div>

              <div>
                <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Primary Muscle</label>
                <select 
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value as MuscleGroupName)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary/50 transition-colors outline-none appearance-none"
                >
                  {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Weight (KG)</label>
                  <input 
                    type="number" 
                    required min="0" step="0.5"
                    value={weight || ''}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary/50 transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-[10px] uppercase font-bold mb-2">Reps</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={reps || ''}
                    onChange={(e) => setReps(Number(e.target.value))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:border-primary/50 transition-colors outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <span className="animate-spin text-xl">⟳</span> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Set'}
              </button>
            </form>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-panel border border-border rounded-2xl p-4 flex flex-col justify-center">
              <Zap className="text-primary mb-2" size={20} />
              <p className="text-2xl font-black text-text-main">{totalSets}</p>
              <p className="text-text-muted text-[10px] uppercase font-bold">Total Sets</p>
            </div>
            <div className="bg-panel border border-border rounded-2xl p-4 flex flex-col justify-center">
              <Dumbbell className="text-emerald-500 mb-2" size={20} />
              <p className="text-2xl font-black text-text-main">{totalVolume.toLocaleString()} <span className="text-text-muted text-sm font-semibold">kg</span></p>
              <p className="text-text-muted text-[10px] uppercase font-bold">Total Volume</p>
            </div>
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-panel border border-border rounded-2xl p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-text-main font-bold">Strength Evolution</h3>
                  <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Weekly Aggregation</p>
                </div>
              </div>
              
              <select 
                value={selectedExerciseFilter}
                onChange={(e) => setSelectedExerciseFilter(e.target.value)}
                className="bg-surface border border-border text-text-main text-xs px-3 py-2 rounded-lg outline-none"
              >
                {uniqueExercises.map(ex => (
                  <option key={ex} value={ex}>{ex.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {weeklyChartData.length > 0 ? (
              <div className="space-y-8">
                {/* Max Weight Chart */}
                <div>
                  <h4 className="text-text-main text-sm font-bold mb-4 flex items-center gap-2">
                    <Target size={16} className="text-primary" /> Max Weight Lifted (KG)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          itemStyle={{ color: '#475569' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="maxWeight" 
                          name="Max Weight"
                          stroke="#475569" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#475569', strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Volume Chart */}
                <div>
                  <h4 className="text-text-main text-sm font-bold mb-4 flex items-center gap-2">
                    <Dumbbell size={16} className="text-emerald-500" /> Weekly Volume (Reps × Weight)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Bar 
                          dataKey="volume" 
                          name="Volume (kg)"
                          fill="#94A3B8" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl">
                <Calendar className="text-text-muted mb-3" size={32} />
                <p className="text-text-main font-bold">No Data Available</p>
                <p className="text-text-muted text-sm mt-1">Log workouts to see your weekly progress.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Aura Quest History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-panel border border-border rounded-2xl p-6 mt-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#FDB913]/10 flex items-center justify-center">
            <Target size={20} className="text-[#FDB913]" />
          </div>
          <div>
            <h3 className="text-text-main font-bold">Aura Quest History</h3>
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Daily Completions</p>
          </div>
        </div>

        {questLogs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {questLogs.slice().reverse().map((log, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-text-muted text-xs font-medium">{new Date(log.date).toLocaleDateString()}</span>
                  <span className="text-[#FDB913] text-xs font-bold">+{log.creditsEarned} Credits</span>
                </div>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-text-muted text-[10px] uppercase font-bold">Quests</p>
                    <p className="text-text-main font-bold text-lg">{log.questsCompleted}/{log.totalQuests}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted text-[10px] uppercase font-bold">Streak Level</p>
                    <p className="text-orange-500 font-bold flex items-center gap-1 justify-end"><Zap size={14} /> Lvl {log.streakLevel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl">
            <Target className="text-text-muted mb-3" size={32} />
            <p className="text-text-main font-bold">No Quests Claimed Yet</p>
            <p className="text-text-muted text-sm mt-1">Complete your daily Aura Quests and claim the bonus to build your history.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
