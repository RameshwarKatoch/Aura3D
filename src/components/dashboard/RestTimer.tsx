import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, X, ChevronUp } from 'lucide-react';

const PRESETS = [60, 90, 120, 180];

interface Props {
  externalStart?: number | null; // a duration in seconds to start from (triggered by command palette)
  onStarted?: () => void;
}

export default function RestTimer({ externalStart, onStarted }: Props) {
  const [duration, setDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [running, setRunning] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // External trigger from command palette
  useEffect(() => {
    if (externalStart != null) {
      setDuration(externalStart);
      setTimeLeft(externalStart);
      setRunning(true);
      setMinimized(false);
      onStarted?.();
    }
  }, [externalStart]);

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        setRunning(false);
        // Fire notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Aura3D — Rest Complete! 💪', {
            body: 'Your muscles are ready. Time for your next set!',
            icon: '/favicon.ico',
          });
        }
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const handleStart = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
    setRunning(true);
  };

  const handleReset = () => {
    setRunning(false);
    setTimeLeft(duration);
  };

  const handlePreset = (secs: number) => {
    setDuration(secs);
    setTimeLeft(secs);
    setRunning(false);
  };

  const pct = timeLeft / duration;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);
  const isLow = timeLeft <= 10 && running;
  const isDone = timeLeft === 0;

  // Color based on time remaining
  const strokeColor = isDone
    ? '#10b981'
    : pct > 0.5
    ? '#0070FF'
    : pct > 0.2
    ? '#f59e0b'
    : '#ef4444';

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isLow ? 'animate-pulse' : ''
      }`}
    >
      {minimized ? (
        /* Minimized pill */
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] rounded-full px-4 py-2.5 shadow-2xl hover:border-primary/50 transition-colors"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: strokeColor }}
          />
          <span className="text-white text-sm font-mono font-bold">{mm}:{ss}</span>
          <ChevronUp size={14} className="text-[#6b7280]" />
        </button>
      ) : (
        /* Full widget */
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl shadow-2xl p-5 w-[220px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer size={15} className="text-primary" />
              <span className="text-white text-xs font-semibold">Rest Timer</span>
            </div>
            <button onClick={() => setMinimized(true)} className="text-[#6b7280] hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Ring */}
          <div className="flex justify-center mb-4">
            <div className="relative w-[90px] h-[90px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={radius} fill="none" stroke="#1f1f1f" strokeWidth="6" />
                <circle
                  cx="45" cy="45" r={radius}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-xl font-mono font-bold leading-none">
                  {mm}:{ss}
                </span>
                {isDone && <span className="text-[#10b981] text-[10px] font-semibold mt-0.5">Done!</span>}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex gap-1.5 mb-4">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => handlePreset(p)}
                className={`flex-1 text-[10px] py-1 rounded-lg font-semibold transition-all ${
                  duration === p && !running
                    ? 'bg-primary text-white'
                    : 'bg-[#1a1a1a] text-[#6b7280] hover:text-white'
                }`}
              >
                {p < 60 ? `${p}s` : `${p / 60}m`}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!running ? (
              <button
                onClick={handleStart}
                disabled={isDone && timeLeft === 0}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Play size={12} fill="white" /> Start
              </button>
            ) : (
              <button
                onClick={() => setRunning(false)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white py-2 rounded-xl text-xs font-semibold hover:bg-[#2a2a2a] transition-colors"
              >
                <Pause size={12} /> Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-[#1a1a1a] text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Notification tip */}
          {notifPermission !== 'granted' && (
            <p className="text-[#4b5563] text-[9px] text-center mt-3 leading-tight">
              Allow notifications to get alerted when rest is complete
            </p>
          )}
        </div>
      )}
    </div>
  );
}
