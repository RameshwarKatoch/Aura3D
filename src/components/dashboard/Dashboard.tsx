import React, { useState, useCallback } from 'react';
import { Activity, Flame, Target, Droplets, Footprints, Plus } from 'lucide-react';
import type { UserProfile, SleepEntry, WorkoutSet, MuscleReadiness, QuestLog } from '../../types';
import {
  calculateBMI,
  calculateNutrition,
  getIdealWeight,
  activityLabels,
  goalLabels,
} from '../../lib/calculations';
import BMIGauge from './BMIGauge';
import MacroRings from './MacroRings';
import MetricCard from './MetricCard';
import SleepChart from './SleepChart';
import type { MuscleGroup } from './Anatomy3D';
import Anatomy3D from './Anatomy3D';
import MuscleSidePanel from './MuscleSidePanel';
import { Sparkles, Zap, Timer, Bed } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import type { TrainingMode } from '../../types';
import PowerSection from './PowerSection';
import EnduranceSection from './EnduranceSection';
import RecoverySection from './RecoverySection';
import OverloadTracker from './OverloadTracker';
import RestTimer from './RestTimer';
import PredictiveAnalytics, { SimulationImpact } from './PredictiveAnalytics';
import { MoodData } from './MoodStressCheck';
import ARViewer from '../avatar/ARViewer';
import WearableIntegration from './WearableIntegration';
import AuraQuests from './AuraQuests';
import AuraQuestSystem from './AuraQuestSystem';
import VoiceControl from '../VoiceControl';
import { useTranslation } from 'react-i18next';
import type { WearableData, Quest } from '../../types';

const mockSleepData = [
  { date: '2026-04-12', hours: 7.2, mood: 'good' },
  { date: '2026-04-13', hours: 6.8, mood: 'okay' },
  { date: '2026-04-14', hours: 8.1, mood: 'great' },
  { date: '2026-04-15', hours: 7.5, mood: 'good' },
  { date: '2026-04-16', hours: 6.5, mood: 'poor' },
  { date: '2026-04-17', hours: 7.0, mood: 'good' },
  { date: '2026-04-18', hours: 7.8, mood: 'great' },
] as const;

interface Props {
  profile: UserProfile;
  onLogWater?: () => void;
  onLogSteps?: () => void;
  onLogSleep?: () => void;
  externalTimerStart?: number | null;
  onTimerStarted?: () => void;
}

export default React.memo(function Dashboard({ profile, onLogWater, onLogSteps, onLogSleep, externalTimerStart, onTimerStarted }: Props) {
  const { i18n } = useTranslation();
  const bmi = calculateBMI(profile.weight_kg, profile.height_cm);
  const nutrition = calculateNutrition(profile);
  const idealWeight = getIdealWeight(profile.height_cm, profile.gender);
  const weightDiff = parseFloat((profile.weight_kg - idealWeight).toFixed(1));
  const [activeMuscle, setActiveMuscle] = useState<MuscleGroup>(null);

  // Local state for interactive widgets
  const [waterIntake, setWaterIntake] = useState(2.5);
  const [dailySteps, setDailySteps] = useState(8432);
  const [consumedCalories, setConsumedCalories] = useState(1850);
  const [sleepData, setSleepData] = useState<SleepEntry[]>([...mockSleepData]);

  // Workout sets for fatigue heatmap
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);

  // Simulation & Mood state for 3D model
  const [simulationImpact, setSimulationImpact] = useState<SimulationImpact | null>(null);
  const [moodData] = useState<MoodData | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [sorenessMap, setSorenessMap] = useState<Record<string, number>>({});

  // Wearable & Quests State
  const [wearableData, setWearableData] = useState<WearableData>({
    heartRate: 72,
    hrv: 64,
    calories: 420,
    isSyncing: false,
    lastSync: Date.now(),
  });

  const [auraCredits, setAuraCredits] = useState(1250);
  const [auraStreak] = useState(3);
  const [activeSkin, setActiveSkin] = useState('blue');
  const [proteinIntake, setProteinIntake] = useState<number>(() => {
    try { return Number(localStorage.getItem('aura_protein_today') || '0'); } catch { return 0; }
  });

  // Progressive Overload Logic for Quests:
  // Quests get 10% harder for each consecutive day in the streak, up to 2x max difficulty.
  const questDifficultyMultiplier = Math.min(2.0, 1 + (auraStreak * 0.1));

  const quests: Quest[] = React.useMemo(() => {
    // Dynamically scale targets based on streak multiplier
    const targetProtein = Math.round(nutrition.targetProtein * Math.min(1.2, questDifficultyMultiplier)); // Cap protein scaling at 20%
    const targetSteps = Math.floor(8000 * questDifficultyMultiplier);
    const targetWater = parseFloat((3.0 * Math.min(1.5, questDifficultyMultiplier)).toFixed(1)); // Cap water scaling at 4.5L

    return [
      { 
        id: 'protein', 
        label: `Power Up: ${targetProtein}g Protein`, 
        target: targetProtein, 
        current: proteinIntake, 
        completed: proteinIntake >= targetProtein 
      },
      { 
        id: 'steps', 
        label: `Movement: ${targetSteps.toLocaleString()} Steps`, 
        target: targetSteps, 
        current: dailySteps, 
        completed: dailySteps >= targetSteps 
      },
      { 
        id: 'water', 
        label: `Hydration: ${targetWater}L`, 
        target: targetWater, 
        current: waterIntake, 
        completed: waterIntake >= targetWater 
      },
    ];
  }, [nutrition.targetProtein, questDifficultyMultiplier, dailySteps, waterIntake, proteinIntake]);

  // 7-day muscle readiness computation
  const computeMuscleReadiness = useCallback((): Record<string, MuscleReadiness> => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 3600_000;
    const recentSets = workoutSets.filter(s => s.timestamp > now - sevenDays);

    // Find most recent set timestamp per muscle
    const lastByMuscle: Record<string, number> = {};
    for (const s of recentSets) {
      if (!lastByMuscle[s.muscleGroup] || s.timestamp > lastByMuscle[s.muscleGroup]) {
        lastByMuscle[s.muscleGroup] = s.timestamp;
      }
    }

    const readiness: Record<string, MuscleReadiness> = {};
    for (const [muscle, lastTs] of Object.entries(lastByMuscle)) {
      const hoursAgo = (now - lastTs) / 3600_000;
      if (hoursAgo < 24)          readiness[muscle] = 'fatigued';
      else if (hoursAgo < 72)    readiness[muscle] = 'recovering';
      else if (hoursAgo < 120)   readiness[muscle] = 'ready';
      else if (hoursAgo < 168)   readiness[muscle] = 'primed';
      else                        readiness[muscle] = 'fresh';
    }
    return readiness;
  }, [workoutSets]);

  const handleAddWater = useCallback(() => setWaterIntake(w => Math.min(w + 0.5, 5)), []);
  const handleAddSteps = useCallback(() => setDailySteps(s => s + 500), []);

  // Allow external triggers from CommandPalette
  const effectiveOnLogWater = onLogWater ?? handleAddWater;
  const effectiveOnLogSteps = onLogSteps ?? handleAddSteps;

  const handleAddSleep = () => {
    const randomHours = parseFloat((Math.random() * (9 - 6.5) + 6.5).toFixed(1));
    const nextDate = new Date(sleepData[sleepData.length - 1].date);
    nextDate.setDate(nextDate.getDate() + 1);
    const newEntry = {
      date: nextDate.toISOString().split('T')[0],
      hours: randomHours,
      mood: randomHours > 7.5 ? 'great' : 'good'
    } as const;
    setSleepData([...sleepData.slice(1), newEntry]);
  };

  const effectiveOnLogSleep = onLogSleep ?? handleAddSleep;

  const handleSyncWearable = useCallback(() => {
    setWearableData(prev => ({ ...prev, isSyncing: true }));
    setTimeout(() => {
      setWearableData({
        heartRate: Math.floor(Math.random() * (120 - 60) + 60),
        hrv: Math.floor(Math.random() * (100 - 20) + 20),
        calories: Math.floor(Math.random() * (1000 - 100) + 100),
        isSyncing: false,
        lastSync: Date.now(),
      });
    }, 1500);
  }, []);

  const handleRecoveryAlert = useCallback(() => {
    // Automatically suggest/switch to recovery mode if possible
    // For now, we just log or show a toast if we had a toast system
    console.log("High Strain Detected - Recovery Mode Suggested");
  }, []);

  const handleVoiceCommand = useCallback((command: string) => {
    if (command.includes('log water') || command.includes('पानी')) {
      effectiveOnLogWater();
    } else if (command.includes('power mode') || command.includes('पावर मोड')) {
      // Logic to switch mode (needs to be implemented in App.tsx or similar)
      console.log("Switching to Power Mode...");
    }
  }, [effectiveOnLogWater]);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLng);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isVeg = profile.dietary_preference === 'veg' || profile.dietary_preference === 'vegan';

  const trainingModeConfig: Record<TrainingMode, { label: string; icon: typeof Zap; color: string; bg: string; border: string; description: string; accent: string }> = {
    power: {
      label: 'Power',
      icon: Zap,
      color: '#475569',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      description: 'Strength Lab · 1RM Focus',
      accent: '#475569',
    },
    endurance: {
      label: 'Endurance',
      icon: Timer,
      color: '#94A3B8',
      bg: 'bg-secondary/10',
      border: 'border-secondary/30',
      description: 'Stamina Engine · HR Zones',
      accent: '#94A3B8',
    },
    recovery: {
      label: 'Recovery',
      icon: Bed,
      color: '#A78BFA',
      bg: 'bg-[#A78BFA]/10',
      border: 'border-[#A78BFA]/30',
      description: 'Restoration Zen · DOMS Map',
      accent: '#A78BFA',
    },
  };

  const activeMode = profile.training_mode ?? 'power';
  const modeConfig = trainingModeConfig[activeMode];
  const ModeIcon = modeConfig.icon;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 relative"
    >
      {activeMuscle && (
        <MuscleSidePanel 
          muscle={activeMuscle} 
          onClose={() => setActiveMuscle(null)} 
          isVeg={isVeg} 
          trainingMode={activeMode}
        />
      )}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Good {getGreeting()}, {profile.name.split(' ')[0]}</h1>
          <p className="text-text-muted text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2 items-center">
          <VoiceControl onCommand={handleVoiceCommand} />
          <button
            onClick={toggleLanguage}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text-main transition-all text-xs font-bold uppercase glass-button"
          >
            {i18n.language === 'en' ? 'हिन्दी' : 'English'}
          </button>
          <button
            onClick={() => setShowAR(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-text-main hover:bg-primary/20 transition-all self-start sm:self-auto shadow-sm"
          >
            <Sparkles size={15} className="text-primary animate-pulse" />
            <span className="text-sm font-semibold leading-tight">Ghost Trainer AR</span>
          </button>
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border glass-panel self-start sm:self-auto`}>
            <ModeIcon size={15} style={{ color: modeConfig.color }} className="animate-pulse" />
            <div>
              <p className="text-text-main text-sm font-semibold leading-tight">{modeConfig.label}</p>
              <p className="text-xs leading-tight" style={{ color: modeConfig.color }}>{modeConfig.description}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Calories Consumed"
          value={consumedCalories.toLocaleString()}
          unit="kcal"
          icon={<Flame size={18} />}
          iconColor="#ef4444"
          subtext={`Target: ${nutrition.targetCalories.toLocaleString()} kcal`}
          onUpdate={(val) => setConsumedCalories(val)}
        />
        <MetricCard
          label="TDEE"
          value={nutrition.tdee.toLocaleString()}
          unit="kcal"
          icon={<Activity size={18} />}
          iconColor="#10b981"
          subtext={activityLabels[profile.activity_level]}
        />
        <MetricCard
          label="Water Intake"
          value={waterIntake.toFixed(1)}
          unit="L"
          icon={<Droplets size={18} />}
          iconColor="#0ea5e9"
          subtext="Target: 3.5L"
          onUpdate={(val) => setWaterIntake(val)}
          actionNode={
            <button 
              onClick={effectiveOnLogWater}
              className="p-1 rounded bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 transition-colors"
            >
              <Plus size={14} />
            </button>
          }
        />
        <MetricCard
          label="Steps"
          value={dailySteps.toLocaleString()}
          unit="steps"
          icon={<Footprints size={18} />}
          iconColor="#8b5cf6"
          subtext="Target: 10,000"
          onUpdate={(val) => setDailySteps(val)}
          actionNode={
            <button 
              onClick={effectiveOnLogSteps}
              className="p-1 rounded bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-colors"
            >
              <Plus size={14} />
            </button>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Anatomy3D 
            activeMuscle={activeMuscle}
            onMuscleClick={(muscle) => {
              setActiveMuscle(muscle);
              if (activeMode === 'recovery' && muscle) {
                const newMap = { ...sorenessMap, [muscle]: 0.8 };
                setSorenessMap(newMap);
              }
            }} 
            weightScale={1 + (weightDiff / profile.weight_kg)}
            muscleReadiness={computeMuscleReadiness()}
            definitionScale={activeMode === 'power' ? 1.2 : 1 + (simulationImpact?.muscleChange ?? 0) / 10}
            posture={moodData?.mood === 'low' ? -1 : moodData?.mood === 'high' ? 1 : 0}
            auraColor={activeMode === 'endurance' ? '#94A3B833' : moodData ? (moodData.stress > 70 ? '#FF3131' : moodData.stress < 30 ? '#475569' : '#FFBD59') : null}
            visualMode={activeMode}
            soreness={sorenessMap}
            activeSkin={activeSkin}
          />
        </div>

        {/* ── Aura Journey (Day-based progressive quest system) ── */}
        <div className="mt-2">
          <AuraQuestSystem profile={profile} />
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <div className={`p-6 rounded-2xl border ${modeConfig.border} ${modeConfig.bg} h-full flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <modeConfig.icon size={24} style={{ color: modeConfig.color }} />
                  <h3 className="text-xl font-bold text-text-main uppercase tracking-tighter">{modeConfig.label} Mode</h3>
                </div>
                <p className="text-text-muted text-sm mb-6 flex-1">{modeConfig.description}. All modules optimized for high-performance {activeMode} output.</p>
                <div className="mt-auto pt-6 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-2">
                    <span className="text-text-muted">Mood Sync</span>
                    <span style={{ color: modeConfig.color }}>Connected</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full" 
                      style={{ backgroundColor: modeConfig.color }}
                      animate={{ width: ['20%', '80%', '50%'] }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mode-Specific Content Area with Page Morph */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: "anticipate" }}
        >
          {activeMode === 'power' && <PowerSection isVeg={isVeg} />}
          {activeMode === 'endurance' && <EnduranceSection isVeg={isVeg} />}
          {activeMode === 'recovery' && <RecoverySection isVeg={isVeg} sorenessMap={sorenessMap} onSorenessChange={setSorenessMap} />}
        </motion.div>
      </AnimatePresence>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PredictiveAnalytics profile={profile} onSimulationChange={setSimulationImpact} />
        </div>
        <div className="flex flex-col gap-4">
          <WearableIntegration 
            data={wearableData} 
            onSync={handleSyncWearable} 
            sleepHours={sleepData[sleepData.length-1].hours}
            onRecoveryAlert={handleRecoveryAlert}
          />
          <SleepChart data={sleepData} onLogSleep={effectiveOnLogSleep} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-panel border border-border rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4 self-start">Body Mass Index</h3>
          <BMIGauge bmi={bmi} />
          <div className="mt-4 w-full grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Under', range: '< 18.5', active: bmi.value < 18.5 },
              { label: 'Healthy', range: '18.5–24.9', active: bmi.value >= 18.5 && bmi.value < 25 },
              { label: 'Over', range: '≥ 25', active: bmi.value >= 25 },
            ].map(item => (
              <div
                key={item.label}
                className={`rounded-lg p-2 ${item.active ? 'bg-surface' : ''}`}
              >
                <p className={`text-xs font-medium ${item.active ? 'text-text-main' : 'text-text-muted'}`}>{item.label}</p>
                <p className="text-text-muted text-[10px]">{item.range}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-panel border border-border rounded-2xl p-6">
          <h3 className="text-text-muted text-xs font-medium uppercase tracking-wider mb-5">Daily Macro Targets</h3>
          <MacroRings
            calories={nutrition.targetCalories}
            protein={nutrition.targetProtein}
            carbs={nutrition.targetCarbs}
            fat={nutrition.targetFat}
          />

          <div className="mt-6 space-y-3">
            {[
              { label: 'Protein', value: nutrition.targetProtein, color: '#3b82f6', total: nutrition.targetCalories },
              { label: 'Carbohydrates', value: nutrition.targetCarbs, color: '#f59e0b', total: nutrition.targetCalories },
              { label: 'Fat', value: nutrition.targetFat, color: '#ef4444', total: nutrition.targetCalories },
            ].map(macro => {
              const cals = macro.label === 'Fat' ? macro.value * 9 : macro.value * 4;
              const pct = Math.round((cals / macro.total) * 100);
              return (
                <div key={macro.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-text-muted text-xs">{macro.label}</span>
                    <span className="text-text-main text-xs font-medium">{macro.value}g <span className="text-text-muted">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: macro.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-panel border border-border rounded-2xl p-6">
          <h3 className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">Weight Journey</h3>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-text-muted text-xs mb-1">Current</p>
              <p className="text-text-main text-3xl font-bold">{profile.weight_kg}<span className="text-text-muted text-base ml-1">kg</span></p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full h-px bg-border relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-1000"
                  style={{
                    backgroundColor: weightDiff === 0 ? '#10b981' : weightDiff > 0 ? '#f59e0b' : '#3b82f6',
                    width: `${Math.min(100, Math.abs(weightDiff / profile.weight_kg) * 1000)}%`,
                    left: weightDiff < 0 ? 'auto' : '0',
                    right: weightDiff < 0 ? '0' : 'auto',
                  }}
                />
              </div>
              <p className="text-text-muted text-xs mt-2">
                {weightDiff === 0 ? 'At ideal weight' : weightDiff > 0 ? `${weightDiff}kg above ideal` : `${Math.abs(weightDiff)}kg below ideal`}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Ideal</p>
              <p className="text-text-main text-3xl font-bold">{idealWeight}<span className="text-text-muted text-base ml-1">kg</span></p>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-border rounded-2xl p-6">
          <h3 className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">Profile Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Age', value: `${profile.age} years` },
              { label: 'Gender', value: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) },
              { label: 'Goal', value: goalLabels[profile.goal] },
              { label: 'Diet', value: profile.dietary_preference.replace('_', '-').toUpperCase() },
            ].map(item => (
              <div key={item.label} className="bg-surface rounded-xl p-3 border border-border">
                <p className="text-text-muted text-xs mb-1">{item.label}</p>
                <p className="text-text-main text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Target size={16} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-primary text-xs font-medium">Protein Target</p>
              <p className="text-text-main text-sm">{nutrition.targetProtein}g/day <span className="text-text-muted text-xs">({(nutrition.targetProtein / profile.weight_kg).toFixed(1)}g per kg)</span></p>
            </div>
          </div>
          <div className={`mt-2 flex items-center gap-2 rounded-xl p-3 border ${modeConfig.bg} ${modeConfig.border}`}>
            <ModeIcon size={16} style={{ color: modeConfig.color }} className="flex-shrink-0" />
            <div>
              <p className="text-xs font-medium" style={{ color: modeConfig.color }}>Active: {modeConfig.label}</p>
              <p className="text-text-main text-sm">{modeConfig.description}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overload Tracker */}
      <motion.div variants={itemVariants}>
        <OverloadTracker onSetsUpdate={sets => setWorkoutSets(sets)} />
      </motion.div>

      {/* Rest Timer (floating widget) */}
      <RestTimer
        externalStart={externalTimerStart}
        onStarted={onTimerStarted}
      />

      {/* AR Viewer Modal */}
      {showAR && (
        <ARViewer onClose={() => setShowAR(false)} />
      )}
    </motion.div>
  );
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
