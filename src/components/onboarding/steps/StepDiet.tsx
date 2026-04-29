import { AlertCircle } from 'lucide-react';
import type { OnboardingData, DietaryPreference } from '../../../types';

interface Props {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onBack: () => void;
  onFinish: () => void;
  loading: boolean;
  error: string;
}

const diets: { value: DietaryPreference; label: string; description: string; color: string }[] = [
  { value: 'non_veg', label: 'Non-Vegetarian', description: 'Includes meat, poultry, fish & eggs', color: '#ef4444' },
  { value: 'veg', label: 'Vegetarian', description: 'Includes dairy & eggs, no meat', color: '#10b981' },
  { value: 'vegan', label: 'Vegan', description: 'Entirely plant-based diet', color: '#22c55e' },
  { value: 'keto', label: 'Ketogenic', description: 'High fat, very low carbohydrate', color: '#f59e0b' },
];

export default function StepDiet({ data, update, onBack, onFinish, loading, error }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Dietary preference</h2>
      <p className="text-[#6b7280] mb-8 text-sm">We'll curate food suggestions based on your diet type.</p>

      <div className="space-y-2">
        {diets.map(diet => (
          <button
            key={diet.value}
            onClick={() => update({ dietary_preference: diet.value })}
            className={`w-full flex items-center gap-4 py-4 px-4 rounded-xl text-left transition-all duration-200 border ${
              data.dietary_preference === diet.value
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: data.dietary_preference === diet.value ? diet.color : '#3a3a3a' }}
            />
            <div className="flex-1">
              <p className={`font-medium text-sm ${data.dietary_preference === diet.value ? 'text-white' : 'text-[#9ca3af]'}`}>
                {diet.label}
              </p>
              <p className="text-[#4b5563] text-xs mt-0.5">{diet.description}</p>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#9ca3af] font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating profile...
            </span>
          ) : 'Launch Dashboard'}
        </button>
      </div>
    </div>
  );
}
