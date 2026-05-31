import { LayoutDashboard, Utensils, PersonStanding, User, LogOut, Zap, Timer, Bed, Trophy, Flame, Activity, Refrigerator, LineChart } from 'lucide-react';
import type { AppView, TrainingMode, DietaryPreference } from '../../types';
import { supabase } from '../../lib/supabase';

interface Props {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  userName: string;
  onSignOut: () => void;
  trainingMode: TrainingMode;
  onTrainingModeChange: (mode: TrainingMode) => void;
  dietaryPreference?: DietaryPreference;
  onDietaryPreferenceChange?: (diet: DietaryPreference) => void;
}

const navItems: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'nutrition', label: 'Nutrition', icon: Utensils },
  { view: 'avatar', label: 'Body Avatar', icon: PersonStanding },
  { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { view: 'form_check', label: 'Form Check', icon: Activity },
  { view: 'progress', label: 'Progress Log', icon: LineChart },
  { view: 'profile', label: 'Profile', icon: User },
];

const trainingModes = [
  { id: 'power', label: 'Power', icon: Zap },
  { id: 'endurance', label: 'Endurance', icon: Timer },
  { id: 'recovery', label: 'Recovery', icon: Bed },
] as const;

export default function Sidebar({ activeView, onNavigate, userName, onSignOut, trainingMode, onTrainingModeChange, dietaryPreference, onDietaryPreferenceChange }: Props) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  // Compute Social Streak
  const computeStreak = () => {
    try {
      const raw = localStorage.getItem('aura3d_workout_logs');
      if (!raw) return 0;
      const sets = JSON.parse(raw);
      if (!Array.isArray(sets) || sets.length === 0) return 0;

      // Get unique dates
      const dates = [...new Set(sets.map((s: any) => new Date(s.timestamp).toDateString()))] as string[];
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // newest first

      let streak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // If they didn't train today, check if they trained yesterday to continue streak
      if (dates.length && new Date(dates[0]).setHours(0,0,0,0) < checkDate.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (new Date(dates[0]).setHours(0,0,0,0) < checkDate.getTime()) {
          return 0; // Streak broken
        }
      }

      for (const d of dates) {
        if (new Date(d).setHours(0,0,0,0) === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    } catch { return 0; }
  };

  const streak = computeStreak();

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 h-screen glass-panel fixed left-0 top-0 z-40 border-r border-border">
        {/* Header */}
        <div className="p-5 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="font-black text-lg tracking-tight text-text-main" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Aura<span className="text-gradient-primary">3D</span>
              </span>
            </div>
            {/* Journey Day Badge */}
            {(() => {
              try {
                const d = localStorage.getItem('aura_quest_system_v2');
                if (d) {
                  const parsed = JSON.parse(d);
                  const dayNum = Math.floor((Date.now() - new Date(parsed.startDate).getTime()) / 86400000) + 1;
                  return (
                    <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                      Day {dayNum}
                    </span>
                  );
                }
              } catch {}
              return null;
            })()}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:text-text-main hover:bg-black/5'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                )}
                <Icon size={16} className={`transition-transform ${active ? 'text-primary' : 'group-hover:scale-110'}`} />
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}

          <div className="mt-8 mb-2 px-3">
            <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wider">Training Mode</h3>
          </div>
          <div className="px-2 space-y-1">
            {trainingModes.map(mode => {
              const Icon = mode.icon;
              const active = trainingMode === mode.id && activeView === 'dashboard';
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onTrainingModeChange(mode.id);
                    onNavigate('dashboard');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    active
                      ? 'bg-primary/20 text-text-main border border-primary/30'
                      : 'text-text-muted hover:text-text-main hover:bg-surface'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-primary' : ''} />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {dietaryPreference && onDietaryPreferenceChange && (
            <>
              <div className="mt-8 mb-2 px-3">
                <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wider">Dietary Preference</h3>
              </div>
              <div className="px-2 space-y-1">
                {[
                  { id: 'non_veg', label: 'Non-Vegetarian' },
                  { id: 'veg', label: 'Vegetarian' }
                ].map(diet => {
                  const active = dietaryPreference === diet.id || (diet.id === 'veg' && dietaryPreference === 'vegan');
                  return (
                    <button
                      key={diet.id}
                      onClick={() => onDietaryPreferenceChange(diet.id as DietaryPreference)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        active
                          ? 'bg-primary/20 text-text-main border border-primary/30'
                          : 'text-text-muted hover:text-text-main hover:bg-surface'
                      }`}
                    >
                      {diet.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <span className="text-text-main text-sm font-medium truncate">{userName}</span>
              {streak > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Flame 
                    size={12 + Math.min(streak, 10)} 
                    className="text-orange-500 animate-pulse" 
                    fill="#f97316"
                  />
                  <span className="text-[#f97316] text-[10px] font-bold">{streak} Day Streak!</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-red-600 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel/95 backdrop-blur-xl border-t border-border flex">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 relative ${
                active ? 'text-primary' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon size={19} />
              <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
