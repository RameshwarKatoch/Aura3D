import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import type { WearableData } from '../../types';

interface WearableIntegrationProps {
  data: WearableData;
  onSync: () => void;
  sleepHours: number;
  onRecoveryAlert: () => void;
}

export default function WearableIntegration({ data, onSync, sleepHours, onRecoveryAlert }: WearableIntegrationProps) {
  const recoveryScore = Math.round((data.hrv / 100) * 60 + (sleepHours / 8) * 40);
  const isHighStrain = data.hrv < 40 && sleepHours < 6;

  useEffect(() => {
    if (isHighStrain) {
      onRecoveryAlert();
    }
  }, [isHighStrain, onRecoveryAlert]);

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 h-full flex flex-col" role="region" aria-label="Bio-Metric Data Overview">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg leading-tight">Live Bio-Metrics</h3>
          <p className="text-[#6b7280] text-xs uppercase tracking-widest mt-1">Smartwatch Sync Active</p>
        </div>
        <button
          onClick={onSync}
          disabled={data.isSyncing}
          aria-label="Sync wearable data"
          tabIndex={0}
          className={`p-2.5 rounded-xl border border-[#1f1f1f] bg-[#161616] text-white hover:bg-[#1f1f1f] transition-all ${data.isSyncing ? 'opacity-50' : ''}`}
        >
          <RefreshCw size={18} className={data.isSyncing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="list">
        {/* Heart Rate Widget */}
        <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart size={18} fill="currentColor" />
              </motion.div>
            </div>
            <span className="text-[#9ca3af] text-xs font-medium uppercase">Heart Rate</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{data.heartRate}</span>
            <span className="text-[#6b7280] text-sm">BPM</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500/20">
            <motion.div
              className="h-full bg-red-500"
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 2 }}
            />
          </div>
        </div>

        {/* HRV Widget */}
        <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Activity size={18} />
            </div>
            <span className="text-[#9ca3af] text-xs font-medium uppercase">HRV</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{data.hrv}</span>
            <span className="text-[#6b7280] text-sm">ms</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500/20">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: `${data.hrv}%` }}
              transition={{ duration: 2 }}
            />
          </div>
        </div>

        {/* Active Calories Widget */}
        <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Zap size={18} />
            </div>
            <span className="text-[#9ca3af] text-xs font-medium uppercase">Active Burn</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{data.calories}</span>
            <span className="text-[#6b7280] text-sm">kcal</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500/20">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: "0%" }}
              animate={{ width: "45%" }}
              transition={{ duration: 2 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHighStrain && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-4"
          >
            <div className="p-2 rounded-full bg-red-500 text-white">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-red-500 font-bold text-sm">High Strain Detected</h4>
              <p className="text-red-500/80 text-xs mt-0.5">Your HRV is low ({data.hrv}ms) and sleep was under 6h. We recommend switching to Recovery Mode to prevent injury.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#9ca3af] text-xs font-medium">Recovery Score</span>
            <span className={`text-sm font-bold ${recoveryScore > 70 ? 'text-green-500' : recoveryScore > 40 ? 'text-orange-500' : 'text-red-500'}`}>
              {recoveryScore}%
            </span>
          </div>
          <div className="h-2 bg-[#161616] rounded-full overflow-hidden border border-[#1f1f1f]">
            <motion.div
              className={`h-full rounded-full ${recoveryScore > 70 ? 'bg-green-500' : recoveryScore > 40 ? 'bg-orange-500' : 'bg-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${recoveryScore}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
