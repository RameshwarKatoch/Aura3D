import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import type { UserProfile, AppView, TrainingMode, WorkoutSet, SleepEntry } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/layout/CommandPalette';
import BioCoach from './components/coach/BioCoach';

// Lazy loaded views for performance
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const NutritionView = lazy(() => import('./components/nutrition/NutritionView'));
const AvatarView = lazy(() => import('./components/avatar/AvatarView'));
const ProfileView = lazy(() => import('./components/profile/ProfileView'));
const LeaderboardView = lazy(() => import('./components/leaderboard/LeaderboardView'));
const FormCheckView = lazy(() => import('./components/formcheck/FormCheckView'));
const ProgressView = lazy(() => import('./components/progress/ProgressView'));

type AppState = 'loading' | 'onboarding' | 'app';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  // Command palette triggers increments via counter; Dashboard reads them via useEffect
  const [_waterLog, setWaterLog] = useState(0);
  const [_stepsLog, setStepsLog] = useState(0);
  const [_sleepLog, setSleepLog] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);

  // Read workoutSets from localStorage for BioCoach context
  const workoutSets = useMemo<WorkoutSet[]>(() => {
    try {
      const raw = localStorage.getItem('aura3d_workout_logs');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  // Mock sleep data (same as Dashboard) for BioCoach context
  const sleepData = useMemo<SleepEntry[]>(() => [
    { date: '2026-04-12', hours: 7.2, mood: 'good' },
    { date: '2026-04-13', hours: 6.8, mood: 'okay' },
    { date: '2026-04-14', hours: 8.1, mood: 'great' },
    { date: '2026-04-15', hours: 7.5, mood: 'good' },
    { date: '2026-04-16', hours: 6.5, mood: 'poor' },
    { date: '2026-04-17', hours: 7.0, mood: 'good' },
    { date: '2026-04-18', hours: 7.8, mood: 'great' },
  ], []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setAppState('onboarding');
        }
      } catch (err) {
        console.error('Supabase session check failed:', err);
        setAppState('onboarding');
      }
    };

    checkSession();

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        (async () => {
          if (event === 'SIGNED_OUT') {
            setProfile(null);
            setAppState('onboarding');
          } else if (event === 'SIGNED_IN' && session?.user) {
            await loadProfile(session.user.id);
          }
        })();
      });
      subscription = data.subscription;
    } catch (err) {
      console.error('Supabase auth listener failed:', err);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setAppState('app');
    } else {
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = (completedProfile: UserProfile) => {
    setProfile(completedProfile);
    setAppState('app');
  };

  const handleSignOut = () => {
    setProfile(null);
    setAppState('onboarding');
  };

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await supabase.from('user_profiles').update(updates).eq('user_id', profile.user_id);
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] top-1/3 left-1/3 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-8 relative z-10"
        >
          {/* Logo mark */}
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full border border-primary/20 absolute inset-0"
              style={{ borderStyle: 'dashed' }}
            />
            {/* Middle ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border border-cyan-400/20 absolute top-2 left-2"
            />
            {/* Core */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(71,85,105,0.4)',
                  '0 0 50px rgba(148,163,184,0.5)',
                  '0 0 20px rgba(71,85,105,0.4)'
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </motion.div>
          </div>

          {/* Wordmark */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Aura<span className="text-gradient-primary">3D</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-text-muted text-sm mt-1 tracking-widest uppercase font-medium"
            >
              AI-Powered Health Platform
            </motion.p>
          </div>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '220px' }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-56 h-0.5 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
                className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                style={{ backgroundSize: '200%' }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1] }}
              transition={{ delay: 0.6, duration: 1.5, repeat: Infinity }}
              className="text-text-muted text-[11px] tracking-[0.2em] uppercase"
            >
              Initializing...
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-surface">
      {/* Ambient background layers */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-60 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute w-[600px] h-[600px] bg-primary/3 rounded-full blur-[160px] -top-32 left-1/3" />
        <div className="absolute w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[120px] top-1/2 right-0" />
        <div className="absolute w-[300px] h-[300px] bg-violet-500/3 rounded-full blur-[100px] bottom-0 left-1/4" />
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        onNavigate={(view) => { setActiveView(view); }}
        onTrainingModeChange={(mode: TrainingMode) => handleProfileUpdate({ training_mode: mode })}
        onLogWater={() => setWaterLog(w => w + 1)}
        onLogSteps={() => setStepsLog(s => s + 1)}
        onLogSleep={() => setSleepLog(s => s + 1)}
        onStartTimer={(secs) => setTimerStart(secs)}
      />

      {/* AI Bio-Coach — mounted at app level, persists across all views */}
      <BioCoach
        profile={profile}
        workoutSets={workoutSets}
        sleepData={sleepData}
      />

      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        userName={profile.name}
        onSignOut={handleSignOut}
        trainingMode={profile.training_mode || 'power'}
        onTrainingModeChange={(mode) => handleProfileUpdate({ training_mode: mode })}
        dietaryPreference={profile.dietary_preference}
        onDietaryPreferenceChange={(diet) => handleProfileUpdate({ dietary_preference: diet })}
      />

      <main className="lg:ml-60 min-h-screen relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
                  </div>
                  <span className="text-text-muted text-sm">Loading module...</span>
                </div>
              }>
                {activeView === 'dashboard' && <Dashboard
                  profile={profile}
                  onLogWater={() => setWaterLog(w => w + 1)}
                  onLogSteps={() => setStepsLog(s => s + 1)}
                  onLogSleep={() => setSleepLog(s => s + 1)}
                  externalTimerStart={timerStart}
                  onTimerStarted={() => setTimerStart(null)}
                />}
                {activeView === 'nutrition' && <NutritionView profile={profile} />}
                {activeView === 'avatar' && <AvatarView profile={profile} />}
                {activeView === 'leaderboard' && <LeaderboardView profile={profile} />}
                {activeView === 'form_check' && <FormCheckView key="form_check" profile={profile!} />}
                {activeView === 'progress' && <ProgressView key="progress" profile={profile!} />}
                {activeView === 'profile' && (
                  <ProfileView
                    profile={profile}
                    onUpdate={updatedProfile => setProfile(updatedProfile)}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
