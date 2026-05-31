import { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, AlertTriangle, CheckCircle, Flame, Target } from 'lucide-react';
import type { UserProfile } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

type ScanState = 'idle' | 'scanning' | 'result' | 'logged';

interface MockFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isMeat: boolean;
}

const MOCK_RESULTS: MockFoodResult[] = [
  { name: 'Grilled Chicken Breast', calories: 280, protein: 54, carbs: 0, fat: 6, isMeat: true },
  { name: 'Avocado Toast', calories: 320, protein: 8, carbs: 35, fat: 18, isMeat: false },
  { name: 'Baked Salmon', calories: 410, protein: 44, carbs: 0, fat: 26, isMeat: true },
  { name: 'Caesar Salad with Chicken', calories: 380, protein: 32, carbs: 12, fat: 22, isMeat: true },
  { name: 'Quinoa Bowl with Tofu', calories: 450, protein: 22, carbs: 55, fat: 16, isMeat: false },
];

export default function VisionScanModal({ isOpen, onClose, profile }: Props) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<MockFoodResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setTimeout(() => {
        setScanState('idle');
        setResult(null);
      }, 300);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
      // Fallback to file upload only
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    setScanState('scanning');
    stopCamera();
    
    // Simulate API delay
    setTimeout(() => {
      const randomFood = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(randomFood);
      setScanState('result');
    }, 2500);
  };

  const handleSimulateScan = () => {
    setScanState('scanning');
    
    // Simulate API delay
    setTimeout(() => {
      const randomFood = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(randomFood);
      setScanState('result');
    }, 2500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSimulateScan();
    }
  };

  const handleLogFood = () => {
    setScanState('logged');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  // Check dietary mismatch
  const isVegetarianOrVegan = profile.dietary_preference === 'veg' || profile.dietary_preference === 'vegan';
  const hasDietaryMismatch = result?.isMeat && isVegetarianOrVegan;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-panel border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Camera size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-text-main font-bold">Vision Scan</h2>
              <p className="text-text-muted text-xs">AI Food Recognition</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface text-text-muted hover:text-text-main hover:bg-border transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {scanState === 'idle' && (
            <div className="flex flex-col items-center justify-center py-4">
              {!cameraActive ? (
                <div className="w-full space-y-4">
                  <div 
                    className="w-full aspect-video border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-surface cursor-pointer hover:border-primary/50 transition-colors group"
                    onClick={startCamera}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Camera size={24} className="text-primary" />
                    </div>
                    <p className="text-text-main font-medium mb-1">Open Live Scanner</p>
                    <p className="text-text-muted text-xs">Scan food in real-time</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-surface border border-border rounded-xl text-text-main text-sm font-bold flex items-center justify-center gap-2 hover:bg-border transition-all"
                  >
                    <Upload size={16} className="text-primary" />
                    Upload from Gallery
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="relative aspect-video bg-surface rounded-2xl overflow-hidden border border-primary/30">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full animate-pulse" />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleCapture}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Analyze Food
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="text-text-muted text-xs font-bold uppercase hover:text-text-main transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
              />
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-2xl border-4 border-border" />
                <div className="absolute inset-0 rounded-2xl border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera size={28} className="text-text-muted animate-pulse" />
                </div>
                <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse opacity-50" />
              </div>
              <p className="text-text-main font-medium animate-pulse">Analyzing image...</p>
              <p className="text-text-muted text-sm mt-1">Identifying ingredients and calculating macros</p>
            </div>
          )}

          {scanState === 'result' && result && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Dietary Mismatch Warning */}
              {hasDietaryMismatch && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-500 font-bold text-sm">Dietary Mismatch Detected</h4>
                    <p className="text-red-600 text-xs mt-1 leading-relaxed">
                      This item appears to contain meat, but your profile is set to <strong>{profile.dietary_preference === 'veg' ? 'Vegetarian' : 'Vegan'} Mode</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Result Card */}
              <div className="bg-surface border border-border rounded-2xl p-5 mb-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />
                <p className="text-text-muted text-xs font-semibold tracking-wider uppercase mb-1">Identified Food</p>
                <h3 className="text-2xl font-bold text-text-main">{result.name}</h3>
              </div>

              {/* Macro Inputs */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="flex items-center gap-1.5 text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
                    <Flame size={14} className="text-orange-500" /> Calories
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={result.calories}
                      readOnly
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-semibold focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">kcal</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
                    <Target size={14} className="text-blue-500" /> Protein
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={result.protein}
                      readOnly
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main font-semibold focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">g</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogFood}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all transform active:scale-[0.98]"
              >
                Log Meal
              </button>
            </div>
          )}

          {scanState === 'logged' && (
            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Meal Logged!</h3>
              <p className="text-text-muted text-sm text-center">Your macros have been updated.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
