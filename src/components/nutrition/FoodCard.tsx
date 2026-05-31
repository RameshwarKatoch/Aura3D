import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import type { FoodItem } from '../../types';

interface Props {
  item: FoodItem;
  onLog?: (item: FoodItem) => void;
}

const categoryColors: Record<string, string> = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#ef4444',
  vegetables: '#10b981',
};

const mealIcons: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🥜',
};

export default function FoodCard({ item, onLog }: Props) {
  const [isLogging, setIsLogging] = useState(false);
  const [customWeight, setCustomWeight] = useState(item.serving_g);

  const color = categoryColors[item.category] ?? '#10b981';

  const handleConfirmLog = () => {
    if (!onLog) return;
    
    // Scale macros based on custom weight
    const ratio = customWeight / item.serving_g;
    const scaledItem: FoodItem = {
      ...item,
      id: `${item.id}-${Date.now()}`, // Ensure unique ID for the log
      serving_g: customWeight,
      calories: Math.round(item.calories * ratio),
      protein_g: Math.round(item.protein_g * ratio),
      carbs_g: Math.round(item.carbs_g * ratio),
      fat_g: Math.round(item.fat_g * ratio)
    };

    onLog(scaledItem);
    setIsLogging(false);
    setCustomWeight(item.serving_g); // reset
  };

  return (
    <div className="bg-panel border border-border rounded-2xl p-5 hover:border-primary/20 transition-all duration-200 hover:translate-y-[-1px] flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{mealIcons[item.meal_type]}</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {item.category}
          </span>
        </div>
        <span className="text-text-muted text-xs">{item.serving_g}g base</span>
      </div>

      <h3 className="text-text-main font-semibold text-sm mb-3 leading-tight flex-1">{item.name}</h3>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-text-main font-bold text-lg leading-none">{item.calories}</p>
          <p className="text-text-muted text-[10px] mt-0.5">kcal</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-[#3b82f6] font-semibold text-sm">{item.protein_g}g</p>
          <p className="text-text-muted text-[10px] mt-0.5">protein</p>
        </div>
        <div className="text-center">
          <p className="text-[#f59e0b] font-semibold text-sm">{item.carbs_g}g</p>
          <p className="text-text-muted text-[10px] mt-0.5">carbs</p>
        </div>
        <div className="text-center">
          <p className="text-[#ef4444] font-semibold text-sm">{item.fat_g}g</p>
          <p className="text-text-muted text-[10px] mt-0.5">fat</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {item.is_vegan && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 font-medium">Vegan</span>
        )}
        {item.is_veg && !item.is_vegan && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-medium">Veg</span>
        )}
        {item.is_non_veg && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 font-medium">Non-Veg</span>
        )}
        {item.is_keto && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 font-medium">Keto</span>
        )}
      </div>

      {onLog && (
        <div className="mt-auto pt-2 border-t border-border">
          {isLogging ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-main text-xs font-bold focus:border-primary/50 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-bold">g</span>
              </div>
              <button 
                onClick={() => setIsLogging(false)}
                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
              <button 
                onClick={handleConfirmLog}
                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLogging(true)}
              className="w-full py-2 bg-surface hover:bg-primary/10 text-text-main hover:text-primary border border-border hover:border-primary/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Add to Log
            </button>
          )}
        </div>
      )}
    </div>
  );
}
