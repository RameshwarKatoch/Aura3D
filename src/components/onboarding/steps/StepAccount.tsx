import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import type { OnboardingData } from '../../../types';
import InputField from './InputField';

interface Props {
  data: OnboardingData;
  update: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepAccount({ data, update, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = 'Name is required';
    if (!data.email.includes('@')) e.email = 'Valid email required';
    if (data.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
      <p className="text-[#6b7280] mb-8 text-sm">Your personal fitness intelligence starts here.</p>

      <div className="space-y-4">
        <InputField
          icon={<User size={16} />}
          label="Full Name"
          type="text"
          value={data.name}
          onChange={v => update({ name: v })}
          placeholder="Alex Johnson"
          error={errors.name}
        />
        <InputField
          icon={<Mail size={16} />}
          label="Email Address"
          type="email"
          value={data.email}
          onChange={v => update({ email: v })}
          placeholder="alex@example.com"
          error={errors.email}
        />
        <InputField
          icon={<Lock size={16} />}
          label="Password"
          type="password"
          value={data.password}
          onChange={v => update({ password: v })}
          placeholder="At least 6 characters"
          error={errors.password}
        />
      </div>

      <button
        onClick={() => validate() && onNext()}
        className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}
