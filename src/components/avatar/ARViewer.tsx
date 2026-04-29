import { VRButton, ARButton, XR, Controllers, Hands } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { HumanFigure } from '../dashboard/Anatomy3D';
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Smartphone, Activity, Target, Zap, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Pose, Results } from '@mediapipe/pose';
import { Camera as MPCamera } from '@mediapipe/camera_utils';
import { analyzeSquat, analyzePushup, JointAngle, PoseFeedback } from '../../lib/ghostCoach';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onClose: () => void;
  exerciseName?: string;
}

export default function ARViewer({ onClose, exerciseName = "Squats" }: Props) {
  const [hovered, setHovered] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [analysis, setAnalysis] = useState<{ angles: JointAngle[]; feedback: PoseFeedback }>({
    angles: [],
    feedback: { message: "Initializing AI...", isCorrect: true, intensity: 0 }
  });
  const [reps, setReps] = useState(0);
  const [lastState, setLastState] = useState<'up' | 'down'>('up');

  const onResults = useCallback((results: Results) => {
    if (results.poseLandmarks) {
      setLandmarks(results.poseLandmarks);
      
      const res = exerciseName.toLowerCase().includes('squat') 
        ? analyzeSquat(results.poseLandmarks)
        : analyzePushup(results.poseLandmarks);
      
      setAnalysis(res);

      // Simple rep counter logic
      const kneeAngle = res.angles.find(a => a.name === "Knee")?.angle ?? 180;
      if (kneeAngle < 100 && lastState === 'up') {
        setLastState('down');
      } else if (kneeAngle > 160 && lastState === 'down') {
        setLastState('up');
        setReps(r => r + 1);
      }
    }
  }, [exerciseName, lastState]);

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
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);

        if (videoRef.current) {
          camera = new MPCamera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && pose) await pose.send({ image: videoRef.current });
            },
            width: 640,
            height: 480,
          });
          await camera.start();
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error('AR Camera failed:', err);
        // Fallback
        if (videoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            
            const processFrame = async () => {
              if (videoRef.current && pose) {
                await pose.send({ image: videoRef.current });
                requestAnimationFrame(processFrame);
              }
            };
            requestAnimationFrame(processFrame);
            setIsCameraReady(true);
          } catch (e) {
            console.error('AR Camera Fallback failed:', e);
          }
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
    };
  }, [onResults]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Hidden Video for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Header HUD */}
      <div className="absolute top-6 left-6 right-6 z-50 flex items-start justify-between pointer-events-none">
        <div className="flex items-start gap-4 pointer-events-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#2D5BFF] flex items-center justify-center shadow-[0_0_20px_rgba(45,91,255,0.4)]">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-2xl uppercase tracking-tighter leading-tight">Ghost Trainer AR</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[#6b7280] text-xs font-bold uppercase tracking-widest">{exerciseName} Live Protocol</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all self-end"
          >
            <X className="w-7 h-7" />
          </button>
          
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl min-w-[180px] shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider">Session Reps</span>
              <Activity size={12} className="text-[#2D5BFF]" />
            </div>
            <div className="text-4xl font-black text-white">{reps}</div>
            <div className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
              <motion.div 
                className="h-full bg-[#2D5BFF]"
                animate={{ width: `${(reps % 10) * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main AR Scene */}
      <div className="flex-1 relative">
        <ARButton className="!absolute !bottom-10 !left-1/2 !-translate-x-1/2 !bg-[#2D5BFF] !text-white !font-black !uppercase !px-10 !py-5 !rounded-2xl !border-none !shadow-[0_0_40px_rgba(45,91,255,0.5)] !z-50 !text-sm !tracking-widest" />
        
        <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
          <XR>
            <Controllers />
            <Hands />
            
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Environment preset="city" />

            <HumanFigure
              onMuscleClick={() => {}}
              weightScale={1}
              muscleReadiness={{}}
              hovered={hovered}
              setHovered={setHovered}
              posture={1}
              auraColor={analysis.feedback.isCorrect ? "#2D5BFF" : "#FF3131"}
              visualMode="power"
              poseLandmarks={landmarks} // Passing landmarks to update 3D model
            />

            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          </XR>
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        </Canvas>
      </div>

      {/* Real-time Metrics HUD */}
      <div className="absolute bottom-10 left-6 flex flex-col gap-4 z-40 max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div 
            key={analysis.feedback.message}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`p-5 rounded-2xl border backdrop-blur-xl shadow-2xl ${
              analysis.feedback.isCorrect 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {analysis.feedback.isCorrect ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-xs font-black uppercase tracking-widest">Ghost Feedback</span>
            </div>
            <p className="text-xl font-bold text-white">{analysis.feedback.message}</p>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          {analysis.angles.map(angle => (
            <div key={angle.name} className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl">
              <p className="text-[#6b7280] text-[10px] font-bold uppercase tracking-widest mb-1">{angle.name} Angle</p>
              <div className="flex items-end gap-2">
                <span className={`text-2xl font-black ${
                  Math.abs(angle.angle - angle.ideal) < angle.tolerance ? 'text-white' : 'text-[#FF3131]'
                }`}>{angle.angle}°</span>
                <span className="text-[#6b7280] text-[10px] mb-1">Target: {angle.ideal}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AR Placement Helper */}
      <div className="absolute bottom-10 right-6 pointer-events-none">
        <div className="max-w-xs bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-3 text-[#2D5BFF]">
            <Smartphone size={16} />
            <p className="text-white text-xs font-bold uppercase tracking-widest">AR Spatial Setup</p>
          </div>
          <div className="space-y-2">
            {[
              "Align camera to your profile (side-view)",
              "Ensure 2 meters of clear floor space",
              "Enter AR to place your Ghost Coach"
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[#6b7280] font-bold">{i+1}</div>
                <p className="text-[#6b7280] text-[10px] leading-tight font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

