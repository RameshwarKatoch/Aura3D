import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Video, Square, AlertCircle, CheckCircle2, 
  Activity, Info, ChevronRight, Trophy,
  MessageSquare, ChevronDown
} from 'lucide-react';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera as MPCamera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../types';

type ExerciseId = 'squat' | 'pushup' | 'deadlift' | 'shoulder_press' | 'bicep_curl';

const EXERCISES: { id: ExerciseId; label: string; emoji: string; muscleGroup: string; cue: string }[] = [
  { id: 'squat',          label: 'Barbell Squat',    emoji: '🏋️', muscleGroup: 'Quads',     cue: 'Stand sideways, full body visible' },
  { id: 'pushup',         label: 'Push-up',          emoji: '💪', muscleGroup: 'Chest',     cue: 'Set up in front of camera, face down' },
  { id: 'deadlift',       label: 'Deadlift',         emoji: '⚡', muscleGroup: 'Back',      cue: 'Stand sideways, full body visible' },
  { id: 'shoulder_press', label: 'Shoulder Press',   emoji: '🔝', muscleGroup: 'Shoulders', cue: 'Face camera, upper body visible' },
  { id: 'bicep_curl',     label: 'Bicep Curl',       emoji: '💪', muscleGroup: 'Biceps',    cue: 'Stand sideways, arm fully visible' },
];

interface Props {
  profile: UserProfile;
}

export default function FormCheckView({ profile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId>('squat');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<'waiting' | 'calibrating' | 'ready'>('waiting');
  
  const [metrics, setMetrics] = useState({
    primaryAngle: 180,
    secondaryAngle: 0,
    repCount: 0,
    status: 'Stand in view',
    primaryLabel: 'Knee Angle',
    secondaryLabel: 'Back Angle',
  });

  const [sessionWeight, setSessionWeight] = useState('0');

  const stateRef = useRef({
    isDown: false,
    repCount: 0,
    lastFeedbackTime: 0,
    isCalibrated: false,
    exercise: 'squat' as ExerciseId,
  });

  const exerciseDef = EXERCISES.find(e => e.id === selectedExercise)!;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Voice Synthesis
  const speak = useCallback((text: string, priority = false) => {
    if (!('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!priority && now - stateRef.current.lastFeedbackTime < 3000) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /google|premium|male/i.test(v.name)) || voices[0];
    if (preferred) utterance.voice = preferred;
    
    window.speechSynthesis.speak(utterance);
    stateRef.current.lastFeedbackTime = now;
  }, []);

  const calculateAngle = (p1: any, p2: any, p3: any) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0070FF';
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#0070FF', lineWidth: 4 });
      drawLandmarks(ctx, results.poseLandmarks, { color: '#FFFFFF', lineWidth: 2, radius: 3 });
      ctx.shadowBlur = 0;

      const lm = results.poseLandmarks;
      const lVis = (lm[23].visibility ?? 0) + (lm[25].visibility ?? 0);
      const rVis = (lm[24].visibility ?? 0) + (lm[26].visibility ?? 0);
      const s = lVis > rVis ? 'left' : 'right';
      const idx = s === 'left';

      const shoulder = lm[idx ? 11 : 12];
      const elbow    = lm[idx ? 13 : 14];
      const wrist    = lm[idx ? 15 : 16];
      const hip      = lm[idx ? 23 : 24];
      const knee     = lm[idx ? 25 : 26];
      const ankle    = lm[idx ? 27 : 28];

      const ex = stateRef.current.exercise;
      const visible = (hip.visibility ?? 0) > 0.4;

      if (visible) {
        let primary = 180, secondary = 0, status = '';
        let primaryLabel = 'Angle', secondaryLabel = 'Angle';

        if (ex === 'squat') {
          primary = calculateAngle(hip, knee, ankle);
          secondary = Math.abs(Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * 180 / Math.PI + 90);
          primaryLabel = 'Knee Angle'; secondaryLabel = 'Back Lean';
          status = primary < 95 ? '✅ Perfect Depth' : primary < 130 ? '↓ Go Deeper' : '🏠 Standing';
          if (primary < 100 && !stateRef.current.isDown) {
            stateRef.current.isDown = true;
            if (primary < 90) speak('Good depth!');
          } else if (primary > 155 && stateRef.current.isDown) {
            stateRef.current.isDown = false;
            stateRef.current.repCount++;
            speak(`${stateRef.current.repCount}`, true);
          }
          if (secondary > 45 && primary < 140) speak('Chest up!', false);

        } else if (ex === 'pushup') {
          primary = calculateAngle(shoulder, elbow, wrist);
          secondary = Math.abs(Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * 180 / Math.PI + 90);
          primaryLabel = 'Elbow Angle'; secondaryLabel = 'Body Straight';
          status = primary < 90 ? '✅ Full Depth' : primary < 130 ? '↓ Go Lower' : '⬆️ Up Position';
          if (primary < 95 && !stateRef.current.isDown) {
            stateRef.current.isDown = true;
            speak('Good depth!');
          } else if (primary > 155 && stateRef.current.isDown) {
            stateRef.current.isDown = false;
            stateRef.current.repCount++;
            speak(`${stateRef.current.repCount}`, true);
          }
          if (secondary > 20) speak('Keep body straight!', false);

        } else if (ex === 'deadlift') {
          primary = Math.abs(Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * 180 / Math.PI + 90);
          secondary = calculateAngle(hip, knee, ankle);
          primaryLabel = 'Back Angle'; secondaryLabel = 'Knee Angle';
          status = primary < 20 ? '✅ Back Straight' : primary < 40 ? '⚠️ Slight Rounding' : '❌ Round Back';
          const isHinged = secondary < 140;
          if (isHinged && !stateRef.current.isDown) {
            stateRef.current.isDown = true;
          } else if (!isHinged && stateRef.current.isDown) {
            stateRef.current.isDown = false;
            stateRef.current.repCount++;
            speak(`${stateRef.current.repCount}`, true);
          }
          if (primary > 35) speak('Keep your back flat!', false);

        } else if (ex === 'shoulder_press') {
          primary = calculateAngle(shoulder, elbow, wrist);
          secondary = Math.abs(Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * 180 / Math.PI + 90);
          primaryLabel = 'Elbow Angle'; secondaryLabel = 'Torso Lean';
          status = primary > 160 ? '✅ Full Extension' : primary > 90 ? '↑ Press Up' : '↓ Start Position';
          if (primary < 95 && !stateRef.current.isDown) {
            stateRef.current.isDown = true;
          } else if (primary > 155 && stateRef.current.isDown) {
            stateRef.current.isDown = false;
            stateRef.current.repCount++;
            speak(`${stateRef.current.repCount}`, true);
          }
          if (secondary > 15) speak('Stay upright, no lean back!', false);

        } else if (ex === 'bicep_curl') {
          primary = calculateAngle(shoulder, elbow, wrist);
          secondary = Math.abs(shoulder.x - hip.x) * 200; // elbow drift
          primaryLabel = 'Elbow Angle'; secondaryLabel = 'Elbow Drift';
          status = primary < 50 ? '✅ Full Curl' : primary < 120 ? '↑ Curl Up' : '↓ Start';
          if (primary < 55 && !stateRef.current.isDown) {
            stateRef.current.isDown = true;
            speak('Good curl!');
          } else if (primary > 155 && stateRef.current.isDown) {
            stateRef.current.isDown = false;
            stateRef.current.repCount++;
            speak(`${stateRef.current.repCount}`, true);
          }
          if (secondary > 20) speak('Keep elbow pinned to your side!', false);
        }

        setMetrics({
          primaryAngle: Math.round(primary),
          secondaryAngle: Math.round(secondary),
          repCount: stateRef.current.repCount,
          status,
          primaryLabel,
          secondaryLabel,
        });

        if (!stateRef.current.isCalibrated) {
          setCalibrationStatus('ready');
          stateRef.current.isCalibrated = true;
          speak('Ready. Start your set.');
        }
      } else {
        setCalibrationStatus('waiting');
        stateRef.current.isCalibrated = false;
      }
    }
    ctx.restore();
  }, [speak]);

  useEffect(() => {
    let camera: any = null;
    let pose: Pose | null = null;

    const setupCamera = async () => {
      try {
        pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        pose.onResults(onResults);

        if (videoRef.current) {
          // Attempt to start camera using MPCamera utility
          camera = new MPCamera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && pose) await pose.send({ image: videoRef.current });
            },
            width: 1280,
            height: 720,
          });

          await camera.start();
          setIsReady(true);
        }
      } catch (err: any) {
        console.error('Camera initialization failed:', err);
        
        // Fallback for some browsers where MPCamera might fail
        if (videoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            
            const processFrame = async () => {
              if (videoRef.current && pose) {
                await pose.send({ image: videoRef.current });
                videoRef.current.requestVideoFrameCallback?.(processFrame) || requestAnimationFrame(processFrame);
              }
            };
            requestAnimationFrame(processFrame);
            setIsReady(true);
          } catch (fallbackErr) {
            setError(err.message || 'Could not access camera. Please check permissions.');
          }
        } else {
          setError('Video element not found.');
        }
      }
    };

    setupCamera();

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, [onResults]);

  // Sync exercise to stateRef so onResults always reads the current exercise
  useEffect(() => {
    stateRef.current.exercise = selectedExercise;
    stateRef.current.repCount = 0;
    stateRef.current.isDown = false;
    stateRef.current.isCalibrated = false;
    setCalibrationStatus('waiting');
    setMetrics(prev => ({ ...prev, repCount: 0, status: 'Stand in view' }));
  }, [selectedExercise]);

  const startRecording = () => {
    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-session-${Date.now()}.webm`;
      a.click();
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    speak("Recording started");
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    
    if (stateRef.current.repCount > 0) {
      const logEntry = {
        id: Date.now().toString(),
        exercise: exerciseDef.label,
        muscleGroup: exerciseDef.muscleGroup,
        weight: parseFloat(sessionWeight) || 0,
        reps: stateRef.current.repCount,
        timestamp: Date.now(),
      };
      const raw = localStorage.getItem('aura3d_workout_logs');
      const logs = raw ? JSON.parse(raw) : [];
      localStorage.setItem('aura3d_workout_logs', JSON.stringify([logEntry, ...logs]));
      if (profile?.user_id) {
        supabase.from('workout_logs').insert({
          user_id: profile.user_id,
          exercise: logEntry.exercise,
          muscle_group: logEntry.muscleGroup,
          weight: logEntry.weight,
          reps: logEntry.reps,
          timestamp: new Date(logEntry.timestamp).toISOString()
        }).then(({ error }) => {
          if (error) console.error('Failed to sync Form Check log', error);
        });
      }
      speak(`Session saved. ${stateRef.current.repCount} reps logged.`);
    } else {
      speak('Session ended. No reps detected.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-main tracking-tight">AI Form Check</h1>
              <p className="text-text-muted text-sm flex items-center gap-2">
                <Activity size={14} className="text-green-500" />
                Real-time Multi-Exercise Analysis Engine v3.0
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Exercise Picker */}
          <div className="relative">
            <button
              onClick={() => setShowExercisePicker(p => !p)}
              disabled={isRecording}
              className="flex items-center gap-2 bg-panel border border-border hover:border-primary/40 rounded-xl px-4 py-2.5 text-text-main font-bold text-sm transition-all disabled:opacity-50"
            >
              <span>{exerciseDef.emoji}</span>
              {exerciseDef.label}
              <ChevronDown size={14} className="text-text-muted" />
            </button>
            {showExercisePicker && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-panel border border-border rounded-2xl p-2 min-w-[200px] shadow-2xl">
                {EXERCISES.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => { setSelectedExercise(ex.id); setShowExercisePicker(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedExercise === ex.id ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-surface hover:text-text-main'
                    }`}
                  >
                    <span>{ex.emoji}</span> {ex.label}
                    <span className="ml-auto text-[10px] text-text-muted">{ex.muscleGroup}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-panel border border-border rounded-xl px-3 py-2">
            <span className="text-text-muted text-xs font-bold uppercase tracking-widest">Weight</span>
            <input
              type="number"
              value={sessionWeight}
              onChange={(e) => setSessionWeight(e.target.value)}
              className="w-16 bg-transparent text-text-main font-bold text-sm focus:outline-none"
              placeholder="0"
            />
            <span className="text-text-muted text-[10px] font-bold uppercase">KG</span>
          </div>

          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!isReady}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Video size={18} /> Start Session
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
            >
              <Square size={18} /> Finish &amp; Log
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Viewport */}
        <div className="lg:col-span-3">
          <div className="relative aspect-video bg-surface rounded-[32px] overflow-hidden border border-border shadow-2xl group">
            {!isReady && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-surface">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0" />
                </div>
                <p className="text-text-muted font-medium tracking-wide">Syncing AI Models...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20 bg-surface p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-text-main font-bold text-xl mb-2">Camera Access Denied</h3>
                  <p className="text-text-muted leading-relaxed">We need your camera to analyze your form. Please update your permissions in the browser address bar.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-panel border border-border text-text-main px-6 py-2.5 rounded-xl font-semibold hover:bg-surface transition-all"
                >
                  Retry Connection
                </button>
              </div>
            )}

            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover" />

            {/* HUD: Metrics Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-3">
                  <div className="bg-panel/75 backdrop-blur-xl border border-border rounded-2xl p-5 min-w-[200px] shadow-2xl">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Repetition Counter</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-text-main tabular-nums">{metrics.repCount}</span>
                      <span className="text-primary font-bold text-sm">TOTAL REPS</span>
                    </div>
                  </div>
                  
                  <div className="bg-panel/75 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-2xl">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-3">Live Status</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-text-main font-bold text-sm uppercase tracking-wide">
                        {calibrationStatus === 'waiting' ? 'Positioning...' : metrics.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Depth Gauge */}
                <div className="bg-panel/75 backdrop-blur-xl border border-border rounded-2xl p-4 flex flex-col items-center gap-4 shadow-2xl">
                   <div className="h-48 w-4 bg-surface border border-border rounded-full relative overflow-hidden">
                      <div 
                        className={`absolute bottom-0 w-full transition-all duration-200 rounded-full ${metrics.primaryAngle < 90 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-primary'}`}
                        style={{ height: `${Math.max(5, (180 - metrics.primaryAngle) / 1.2)}%` }}
                      />
                      <div className="absolute top-[50%] w-full h-[1px] bg-border" />
                   </div>
                   <p className="text-text-muted text-[10px] font-black uppercase vertical-rl tracking-widest">Range</p>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex gap-4">
                  <div className="bg-panel/75 backdrop-blur-xl border border-border rounded-2xl p-4 min-w-[140px] shadow-2xl">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{metrics.primaryLabel}</p>
                    <p className={`text-2xl font-black ${metrics.primaryAngle < 95 ? 'text-green-500' : 'text-text-main'}`}>
                      {metrics.primaryAngle}°
                    </p>
                  </div>
                  <div className="bg-panel/75 backdrop-blur-xl border border-border rounded-2xl p-4 min-w-[140px] shadow-2xl">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{metrics.secondaryLabel}</p>
                    <p className={`text-2xl font-black ${metrics.secondaryAngle > 40 ? 'text-yellow-500' : 'text-text-main'}`}>
                      {metrics.secondaryAngle}°
                    </p>
                  </div>
                </div>

                {isRecording && (
                  <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-500 font-black text-xs tracking-[0.2em] uppercase">Recording LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calibration Overlay */}
            {calibrationStatus === 'waiting' && isReady && (
              <div className="absolute inset-0 bg-panel/75 backdrop-blur-sm z-10 flex items-center justify-center">
                 <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-64 h-96 border-2 border-dashed border-primary/50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                       <Info className="text-primary/30" size={48} />
                    </div>
                    <h3 className="text-text-main font-bold text-xl mb-2">Step into Frame</h3>
                    <p className="text-text-muted max-w-[240px] mx-auto text-sm">Please position yourself sideways so your full body is visible.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <div className="bg-panel border border-border rounded-[32px] p-6 shadow-xl">
            <h3 className="text-text-main font-bold flex items-center gap-2 mb-6">
              <MessageSquare size={18} className="text-primary" />
              Live Bio-Coach
            </h3>
            
            <div className="space-y-4">
              {/* Primary Metric Feedback */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${metrics.primaryAngle < 95 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    {metrics.primaryAngle < 95
                      ? <CheckCircle2 size={16} className="text-green-500" />
                      : <Info size={16} className="text-yellow-500" />}
                  </div>
                  <div>
                    <p className="text-text-main text-sm font-bold mb-1">{metrics.primaryLabel}</p>
                    <p className="text-text-muted text-xs leading-relaxed">
                      {selectedExercise === 'squat' ? (
                        metrics.primaryAngle < 95
                          ? `Great depth! Knee angle at ${metrics.primaryAngle}° — hitting parallel. Keep driving through your heels.`
                          : metrics.primaryAngle < 130
                          ? `Getting there. Knee angle at ${metrics.primaryAngle}°. Try to go a little deeper — aim for 90°.`
                          : `Knee angle is ${metrics.primaryAngle}°. Stand in frame and begin your squat.`
                      ) : (
                        `Range: ${metrics.primaryAngle}°. Current status: ${metrics.status}`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Metric Feedback */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${metrics.secondaryAngle > 45 ? 'bg-red-500/10' : metrics.secondaryAngle > 30 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                    {metrics.secondaryAngle > 45
                      ? <AlertCircle size={16} className="text-red-500" />
                      : metrics.secondaryAngle > 30
                      ? <Info size={16} className="text-yellow-500" />
                      : <CheckCircle2 size={16} className="text-green-500" />}
                  </div>
                  <div>
                    <p className="text-text-main text-sm font-bold mb-1">{metrics.secondaryLabel}</p>
                    <p className="text-text-muted text-xs leading-relaxed">
                      {selectedExercise === 'squat' ? (
                        metrics.secondaryAngle > 45
                          ? `⚠️ Torso is at ${metrics.secondaryAngle}° — too far forward! Raise your chest and brace your core.`
                          : metrics.secondaryAngle > 30
                          ? `Torso at ${metrics.secondaryAngle}°. Slightly forward — try to keep a more upright posture.`
                          : `Back angle at ${metrics.secondaryAngle}° — looking great! Upright chest, solid position.`
                      ) : (
                        `Angle: ${metrics.secondaryAngle}° (${metrics.secondaryLabel}).`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Score — live calculation */}
            <div className="mt-8 pt-6 border-t border-border">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-widest">Session Score</span>
                  <span className="text-text-main font-black text-xl">
                    {Math.max(0, Math.min(100, Math.round(
                      100 
                      - (Math.max(0, metrics.secondaryAngle - 20) * 0.8) // penalize for excess lean
                      - (Math.max(0, metrics.primaryAngle - 95) * 0.3) // penalize for not going deep
                    )))}
                    /100
                  </span>
               </div>
               <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round(
                      100 
                      - (Math.max(0, metrics.secondaryAngle - 20) * 0.8)
                      - (Math.max(0, metrics.primaryAngle - 95) * 0.3)
                    )))}%`}}
                  />
               </div>
               {metrics.repCount > 0 && (
                 <p className="text-text-muted text-xs mt-3 text-center">
                   {metrics.repCount} rep{metrics.repCount !== 1 ? 's' : ''} logged this set 🔥
                 </p>
               )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-[32px] p-6">
            <h3 className="text-text-main font-bold flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-primary" />
              {metrics.secondaryAngle > 45 ? '⚠️ Fix This First' : metrics.primaryAngle < 95 ? '🔥 Pro Tip' : '💡 Form Tip'}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              {metrics.secondaryAngle > 45
                ? '"Chest up, brace your core like you\'re about to take a punch. A tight core keeps your torso upright through the whole lift."'
                : metrics.primaryAngle > 130
                ? '"Imagine sitting back onto a low chair behind you. Let your hips drop straight down — this naturally increases depth."'
                : '"Maintain consistent foot pressure. Imagining you\'re \'spreading the floor\' with your feet can dramatically improve stability and power transfer."'}
            </p>
            <button className="w-full bg-panel border border-border hover:bg-surface text-text-main py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              View Full Form Guide <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
