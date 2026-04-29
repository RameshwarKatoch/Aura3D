import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bed, Plus } from 'lucide-react';
import type { SleepEntry } from '../../types';

interface Props {
  data: SleepEntry[];
  onLogSleep?: () => void;
}

export default function SleepChart({ data, onLogSleep }: Props) {
  // Map data to chart format
  const chartData = data.map(entry => {
    const dateObj = new Date(entry.date);
    return {
      day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: entry.hours,
      mood: entry.mood,
    };
  });

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bed size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">Sleep Hub</h3>
            <p className="text-[#6b7280] text-xs">7-Day Trends</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <p className="text-white font-bold text-xl">
            {(data.reduce((acc, curr) => acc + curr.hours, 0) / (data.length || 1)).toFixed(1)}<span className="text-[#6b7280] text-sm font-normal ml-1">avg hrs</span>
          </p>
          {onLogSleep && (
            <button
              onClick={onLogSleep}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Log Last Night's Sleep"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0070FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0070FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              domain={[0, 'dataMax + 2']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
              formatter={(value: any) => [`${value} hrs`, 'Slept']}
            />
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="#0070FF" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHours)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
