import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, Calendar, Target } from 'lucide-react';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onSimulationChange: (impact: SimulationImpact) => void;
}

export interface SimulationImpact {
  weightChange: number;
  muscleChange: number;
  goalDateOffset: number;
  burnoutRisk: 'low' | 'moderate' | 'high';
}

export default function PredictiveAnalytics({ profile, onSimulationChange }: Props) {
  const [consistency, setConsistency] = useState(85); // %
  const [extraCalories, setExtraCalories] = useState(0); // kcal/day
  const [intensity, setIntensity] = useState(70); // %

  const simulation = useMemo(() => {
    // Basic logic for simulation impact
    const weightImpact = (extraCalories / 7700) * 30; // 7700 kcal per kg
    const muscleImpact = (consistency / 100) * (intensity / 100) * 1.5 - (1 - consistency / 100) * 1.0;
    
    // Date offset logic: Every 10% below 90% consistency adds 3 days per month
    const dateOffset = Math.max(0, Math.floor((90 - consistency) / 10 * 3));
    
    let burnoutRisk: 'low' | 'moderate' | 'high' = 'low';
    if (intensity > 85 && consistency > 90) burnoutRisk = 'high';
    else if (intensity > 75 || consistency > 95) burnoutRisk = 'moderate';

    return {
      weightChange: parseFloat(weightImpact.toFixed(1)),
      muscleChange: parseFloat(muscleImpact.toFixed(1)),
      goalDateOffset: dateOffset,
      burnoutRisk
    };
  }, [consistency, extraCalories, intensity]);

  useEffect(() => {
    onSimulationChange(simulation);
  }, [simulation, onSimulationChange]);

  const chartData = useMemo(() => {
    const data = [];
    let currentWeight = profile.weight_kg;
    let optimalWeight = profile.weight_kg;
    
    for (let i = 0; i <= 30; i += 5) {
      data.push({
        day: `Day ${i}`,
        current: parseFloat(currentWeight.toFixed(1)),
        optimal: parseFloat(optimalWeight.toFixed(1))
      });
      currentWeight += (simulation.weightChange / 30) * 5;
      optimalWeight -= 0.2 * 5; // Assumed optimal loss rate
    }
    return data;
  }, [profile.weight_kg, simulation.weightChange]);

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2D5BFF]" />
            Predictive Health Twin
          </h3>
          <p className="text-[#6b7280] text-sm">30-day "What-If" simulator</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          simulation.burnoutRisk === 'high' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
          simulation.burnoutRisk === 'moderate' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
          'bg-green-500/20 text-green-500 border border-green-500/30'
        }`}>
          <AlertTriangle className="w-3 h-3" />
          {simulation.burnoutRisk} Risk
        </div>
      </div>

      <div className="space-y-6">
        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[#9ca3af] text-xs font-medium">Workout Consistency</span>
              <span className="text-white text-xs font-bold">{consistency}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={consistency}
              onChange={(e) => setConsistency(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-[#2D5BFF]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[#9ca3af] text-xs font-medium">Extra Daily Calories</span>
              <span className="text-white text-xs font-bold">+{extraCalories} kcal</span>
            </div>
            <input
              type="range"
              min="-500"
              max="1000"
              step="50"
              value={extraCalories}
              onChange={(e) => setExtraCalories(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-[#FF3131]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[#9ca3af] text-xs font-medium">Training Intensity</span>
              <span className="text-white text-xs font-bold">{intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-[#38B6FF]"
            />
          </div>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-[#2D5BFF]" />
              <span className="text-[#6b7280] text-[10px] uppercase font-bold">30d Weight</span>
            </div>
            <p className={`text-lg font-black ${simulation.weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {simulation.weightChange > 0 ? '+' : ''}{simulation.weightChange}kg
            </p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-[#38B6FF]" />
              <span className="text-[#6b7280] text-[10px] uppercase font-bold">Muscle Mass</span>
            </div>
            <p className={`text-lg font-black ${simulation.muscleChange > 0 ? 'text-[#38B6FF]' : 'text-red-400'}`}>
              {simulation.muscleChange > 0 ? '+' : ''}{simulation.muscleChange}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[180px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4b5563', fontSize: 10 }}
              />
              <YAxis 
                hide 
                domain={['dataMin - 2', 'dataMax + 2']} 
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="current" 
                name="Current Path" 
                stroke="#FF3131" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="optimal" 
                name="Optimal Path" 
                stroke="#2D5BFF" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#2D5BFF]/10 border border-[#2D5BFF]/20 rounded-xl p-3 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-[#2D5BFF] mt-0.5" />
          <div>
            <p className="text-white text-xs font-bold">Goal Reach Date</p>
            <p className="text-[#2D5BFF] text-[11px]">
              {simulation.goalDateOffset === 0 
                ? 'On track for June 15, 2026' 
                : `Delayed by ~${simulation.goalDateOffset} days (Estimated)`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
