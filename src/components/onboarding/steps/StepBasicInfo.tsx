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
      <h2 className="text-2xl font-bold text-white mb-1">Basic information</h2>
      <p className="text-[#6b7280] mb-8 text-sm">We use this to calibrate your metrics accurately.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-[#9ca3af] text-xs font-medium mb-2 uppercase tracking-wider">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {genders.map(g => (
              <button
                key={g.value}
                onClick={() => update({ gender: g.value })}
                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  data.gender === g.value
                    ? 'bg-emerald-500 border-emerald-500 text-black'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#9ca3af] hover:border-[#3a3a3a]'
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
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#9ca3af] font-semibold py-3.5 rounded-xl transition-all duration-200"
        >
          Back
        </button>
        <button
          onClick={() => data.age > 0 && onNext()}
          className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
