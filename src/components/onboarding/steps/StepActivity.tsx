import type { OnboardingData, ActivityLevel } from '../../../types';

interface Props {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const levels: { value: ActivityLevel; label: string; description: string; icon: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little or no exercise', icon: '🪑' },
  { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week', icon: '🚶' },
  { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week', icon: '🏋️' },
  { value: 'active', label: 'Very Active', description: 'Hard exercise 6-7 days/week', icon: '🏃' },
  { value: 'very_active', label: 'Extremely Active', description: 'Very hard exercise + physical job', icon: '⚡' },
];

export default function StepActivity({ data, update, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Activity level</h2>
      <p className="text-[#6b7280] mb-8 text-sm">This determines your daily caloric expenditure (TDEE).</p>

      <div className="space-y-2">
        {levels.map(level => (
          <button
            key={level.value}
            onClick={() => update({ activity_level: level.value })}
            className={`w-full flex items-center gap-4 py-3.5 px-4 rounded-xl text-left transition-all duration-200 border ${
              data.activity_level === level.value
                ? 'bg-emerald-500/10 border-emerald-500'
                : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            <span className="text-xl w-8 flex-shrink-0">{level.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${data.activity_level === level.value ? 'text-white' : 'text-[#9ca3af]'}`}>
                {level.label}
              </p>
              <p className="text-[#4b5563] text-xs mt-0.5">{level.description}</p>
            </div>
            {data.activity_level === level.value && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#9ca3af] font-semibold py-3.5 rounded-xl transition-all duration-200"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
