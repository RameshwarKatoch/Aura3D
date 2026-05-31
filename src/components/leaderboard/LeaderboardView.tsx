import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Target, Flame, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
}

interface Athlete {
  id: string;
  name: string;
  isCurrentUser: boolean;
  score: number;
  consistency: number;
  goalProgress: number;
  sleepQuality: number;
  avatarColor: string;
  streak: number;
}

// Fixed mock athletes to populate the leaderboard
const MOCK_ATHLETES: Omit<Athlete, 'isCurrentUser'>[] = [
  { id: '1', name: 'Alex Thompson', score: 940, consistency: 98, goalProgress: 92, sleepQuality: 92, avatarColor: 'bg-blue-500/20 text-blue-500', streak: 14 },
  { id: '2', name: 'Sarah Chen', score: 895, consistency: 92, goalProgress: 88, sleepQuality: 89, avatarColor: 'bg-purple-500/20 text-purple-500', streak: 8 },
  { id: '3', name: 'Marcus Johnson', score: 870, consistency: 88, goalProgress: 85, sleepQuality: 88, avatarColor: 'bg-emerald-500/20 text-emerald-500', streak: 12 },
  { id: '4', name: 'Elena Rodriguez', score: 825, consistency: 85, goalProgress: 80, sleepQuality: 82, avatarColor: 'bg-rose-500/20 text-rose-500', streak: 5 },
  { id: '5', name: 'David Kim', score: 780, consistency: 78, goalProgress: 82, sleepQuality: 74, avatarColor: 'bg-amber-500/20 text-amber-500', streak: 3 },
  { id: '6', name: 'Emma Watson', score: 750, consistency: 75, goalProgress: 75, sleepQuality: 75, avatarColor: 'bg-cyan-500/20 text-cyan-500', streak: 2 },
  { id: '7', name: 'James Wilson', score: 690, consistency: 65, goalProgress: 70, sleepQuality: 72, avatarColor: 'bg-indigo-500/20 text-indigo-500', streak: 1 },
];

function calculateUserMetrics(_profile: UserProfile): Omit<Athlete, 'id' | 'name' | 'isCurrentUser' | 'avatarColor'> {
  // 1. Consistency based on recent sets
  let streak = 0;
  let setsCount = 0;
  try {
    const raw = localStorage.getItem('aura3d_workout_logs');
    if (raw) {
      const sets = JSON.parse(raw);
      setsCount = sets.length;
      
      const dates = [...new Set(sets.map((s: any) => new Date(s.timestamp).toDateString()))] as string[];
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let checkDate = new Date();
      checkDate.setHours(0,0,0,0);
      if (dates.length && new Date(dates[0]).setHours(0,0,0,0) < checkDate.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (new Date(dates[0]).setHours(0,0,0,0) < checkDate.getTime()) {
           // broken
        } else {
          checkDate = new Date(dates[0]);
          checkDate.setHours(0,0,0,0);
        }
      }
      
      if (dates.length > 0 && new Date(dates[0]).setHours(0,0,0,0) >= checkDate.getTime()) {
         for (const d of dates) {
          if (new Date(d).setHours(0,0,0,0) === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      }
    }
  } catch {}
  
  const consistency = Math.min(100, 40 + (setsCount * 2) + (streak * 5));

  // 2. Goal Progress (mocked base + slight variation)
  const goalProgress = 75 + Math.floor(Math.random() * 10);

  // 3. Sleep Quality
  const sleepQuality = 85;

  // Total Score weighting: 50% Consistency, 30% Progress, 20% Sleep
  const score = Math.round((consistency * 0.5 + goalProgress * 0.3 + sleepQuality * 0.2) * 10);

  return { score, consistency, goalProgress, sleepQuality, streak };
}

export default function LeaderboardView({ profile }: Props) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate the user's data and mix it into the leaderboard
    const userMetrics = calculateUserMetrics(profile);
    const currentUser: Athlete = {
      id: profile.user_id || 'current_user',
      name: profile.name,
      isCurrentUser: true,
      avatarColor: 'bg-primary/20 text-primary',
      ...userMetrics
    };

    const combined = [...MOCK_ATHLETES.map(a => ({ ...a, isCurrentUser: false })), currentUser];
    combined.sort((a, b) => b.score - a.score);
    
    setAthletes(combined);
    setLoading(false);
  }, [profile]);

  if (loading) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-3">
            <Trophy size={24} className="text-yellow-500" />
            Global Leaderboard
          </h1>
          <p className="text-text-muted text-sm mt-1">Ranking based on consistency, goal progress, and recovery.</p>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-panel border border-border rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_2fr_1fr_1fr_1fr_100px] gap-4 p-4 border-b border-border bg-surface text-xs font-semibold text-text-muted uppercase tracking-wider items-center">
          <div className="text-center">Rank</div>
          <div>Athlete</div>
          <div className="hidden sm:flex items-center gap-1.5"><TrendingUp size={14}/> Consistency</div>
          <div className="hidden md:flex items-center gap-1.5"><Target size={14}/> Progress</div>
          <div className="hidden lg:flex items-center gap-1.5"><Moon size={14}/> Sleep</div>
          <div className="text-right">Total Score</div>
        </div>

        {/* Table Body (Animated) */}
        <div className="relative">
          <AnimatePresence>
            {athletes.map((athlete, index) => (
              <motion.div
                key={athlete.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.08,
                  type: 'spring',
                  stiffness: 250,
                  damping: 25
                }}
                className={`grid grid-cols-[60px_1fr_auto] sm:grid-cols-[60px_2fr_1fr_1fr_1fr_100px] gap-4 p-4 items-center border-b border-border last:border-0 transition-colors ${
                  athlete.isCurrentUser ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface'
                }`}
              >
                {/* Rank */}
                <div className="text-center font-bold">
                  {index === 0 ? <span className="text-yellow-500 text-lg">1</span> :
                   index === 1 ? <span className="text-gray-300 text-lg">2</span> :
                   index === 2 ? <span className="text-amber-600 text-lg">3</span> :
                   <span className="text-text-muted">{index + 1}</span>}
                </div>

                {/* Athlete Name & Avatar */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${athlete.avatarColor}`}>
                    {athlete.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold truncate ${athlete.isCurrentUser ? 'text-primary' : 'text-text-main'}`}>
                        {athlete.name} {athlete.isCurrentUser && '(You)'}
                      </span>
                    </div>
                    {/* Social Streak Flame inside the row */}
                    {athlete.streak > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame size={12} className="text-orange-500" fill="#f97316" />
                        <span className="text-orange-500 text-[10px] font-bold">{athlete.streak} Day Streak</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="hidden sm:block text-sm text-text-main">
                  <div className="w-full bg-surface border border-border/50 h-1.5 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${athlete.consistency}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-blue-500 h-full rounded-full" 
                    />
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 block">{athlete.consistency}%</span>
                </div>

                <div className="hidden md:block text-sm text-text-main">
                  <div className="w-full bg-surface border border-border/50 h-1.5 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${athlete.goalProgress}%` }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="bg-purple-500 h-full rounded-full" 
                    />
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 block">{athlete.goalProgress}%</span>
                </div>

                <div className="hidden lg:block text-sm text-text-main">
                  <div className="w-full bg-surface border border-border/50 h-1.5 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${athlete.sleepQuality}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="bg-emerald-500 h-full rounded-full" 
                    />
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 block">{athlete.sleepQuality}%</span>
                </div>

                {/* Total Score */}
                <div className="text-right">
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 + (index * 0.1) }}
                    className={`font-bold text-lg inline-block ${athlete.isCurrentUser ? 'text-primary' : 'text-text-main'}`}
                  >
                    {athlete.score.toLocaleString()}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
