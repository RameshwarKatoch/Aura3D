import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { OnboardingData, UserProfile } from '../../types';
import StepAccount from './steps/StepAccount';
import StepBasicInfo from './steps/StepBasicInfo';
import StepMeasurements from './steps/StepMeasurements';
import StepActivity from './steps/StepActivity';
import StepDiet from './steps/StepDiet';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const TOTAL_STEPS = 5;

const defaultData: OnboardingData = {
  name: '',
  email: '',
  password: '',
  age: 25,
  gender: 'male',
  height_cm: 175,
  weight_kg: 75,
  activity_level: 'moderate',
  dietary_preference: 'non_veg',
  goal: 'maintain',
};

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          if (signInError) throw signInError;
          if (!signInData.user) throw new Error('Sign in failed');

          const profile = await upsertProfile(signInData.user.id, data);
          onComplete(profile);
          return;
        }
        throw signUpError;
      }

      if (!authData.user) throw new Error('Registration failed');

      const profile = await upsertProfile(authData.user.id, data);
      onComplete(profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">FormIQ</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i + 1 === step ? '32px' : '8px',
                  backgroundColor: i + 1 <= step ? '#10b981' : '#2a2a2a',
                }}
              />
            ))}
          </div>
          <p className="text-[#6b7280] text-sm">Step {step} of {TOTAL_STEPS}</p>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
          {step === 1 && <StepAccount data={data} update={update} onNext={next} />}
          {step === 2 && <StepBasicInfo data={data} update={update} onNext={next} onBack={back} />}
          {step === 3 && <StepMeasurements data={data} update={update} onNext={next} onBack={back} />}
          {step === 4 && <StepActivity data={data} update={update} onNext={next} onBack={back} />}
          {step === 5 && (
            <StepDiet
              data={data}
              update={update}
              onBack={back}
              onFinish={handleFinish}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}

async function upsertProfile(userId: string, data: OnboardingData): Promise<UserProfile> {
  const profileData = {
    user_id: userId,
    name: data.name,
    age: data.age,
    gender: data.gender,
    height_cm: data.height_cm,
    weight_kg: data.weight_kg,
    activity_level: data.activity_level,
    dietary_preference: data.dietary_preference,
    goal: data.goal,
  };

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  const { data: created, error } = await supabase
    .from('user_profiles')
    .insert(profileData)
    .select()
    .single();
  if (error) throw error;
  return created;
}
