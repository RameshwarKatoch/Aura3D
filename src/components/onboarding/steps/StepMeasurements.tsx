import type { OnboardingData, Goal } from '../../../types';
import InputField from './InputField';

interface Props {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const goals: { value: Goal; label: string; description: string }[] = [
  { value: 'lose', label: 'Fat Loss', description: 'Caloric deficit plan' },
  { value: 'maintain', label: 'Maintain', description: 'Balanced nutrition' },
  { value: 'gain', label: 'Muscle Gain', description: 'Caloric surplus plan' },
];

export default function StepMeasurements({ data, update, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-text-main mb-1">Body measurements</h2>
      <p className="text-text-muted mb-8 text-sm">Used to calculate your BMI and caloric targets.</p>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Height"
            type="number"
            value={data.height_cm}
            onChange={v => update({ height_cm: parseFloat(v) || 0 })}
            placeholder="175"
            suffix="cm"
          />
          <InputField
            label="Weight"
            type="number"
            value={data.weight_kg}
            onChange={v => update({ weight_kg: parseFloat(v) || 0 })}
            placeholder="75"
            suffix="kg"
          />
        </div>

        <div>
          <label className="block text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider">Primary Goal</label>
          <div className="space-y-2">
            {goals.map(g => (
              <button
                key={g.value}
                onClick={() => update({ goal: g.value })}
                className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  data.goal === g.value
                    ? 'bg-primary/10 border-primary text-text-main'
                    : 'bg-surface border-border text-text-muted hover:border-gray-300'
                }`}
              >
                <span>{g.label}</span>
                <span className={`text-xs ${data.goal === g.value ? 'text-primary font-bold' : 'text-text-muted'}`}>
                  {g.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 bg-surface border border-border hover:bg-gray-100 text-text-main font-semibold py-3.5 rounded-xl transition-all duration-200"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-[2] bg-primary hover:bg-primary/95 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
