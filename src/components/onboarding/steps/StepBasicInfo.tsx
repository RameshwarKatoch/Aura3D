import type { OnboardingData, Gender } from '../../../types';
import InputField from './InputField';

interface Props {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const genders: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function StepBasicInfo({ data, update, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-text-main mb-1">Basic information</h2>
      <p className="text-text-muted mb-8 text-sm">We use this to calibrate your metrics accurately.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {genders.map(g => (
              <button
                key={g.value}
                onClick={() => update({ gender: g.value })}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  data.gender === g.value
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-surface border-border text-text-muted hover:border-gray-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <InputField
          label="Age"
          type="number"
          value={data.age}
          onChange={v => update({ age: parseInt(v) || 0 })}
          placeholder="25"
          suffix="yrs"
        />
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 bg-surface border border-border hover:bg-gray-100 text-text-main font-semibold py-3.5 rounded-xl transition-all duration-200"
        >
          Back
        </button>
        <button
          onClick={() => data.age > 0 && onNext()}
          className="flex-[2] bg-primary hover:bg-primary/95 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
