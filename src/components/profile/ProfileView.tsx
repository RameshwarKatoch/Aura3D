import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { UserProfile, ActivityLevel, DietaryPreference, Goal, Gender } from '../../types';
import { activityLabels, dietLabels, goalLabels } from '../../lib/calculations';

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export default function ProfileView({ profile, onUpdate }: Props) {
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const update = (fields: Partial<UserProfile>) => setForm(prev => ({ ...prev, ...fields }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          name: form.name,
          age: form.age,
          gender: form.gender,
          height_cm: form.height_cm,
          weight_kg: form.weight_kg,
          activity_level: form.activity_level,
          dietary_preference: form.dietary_preference,
          goal: form.goal,
        })
        .eq('user_id', profile.user_id)
        .select()
        .single();

      if (updateError) throw updateError;
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Profile</h1>
        <p className="text-text-muted text-sm mt-0.5">Update your personal information and preferences</p>
      </div>

      <div className="bg-panel border border-border rounded-2xl p-6 space-y-5">
        <h3 className="text-text-main font-semibold text-sm">Personal Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update({ name: e.target.value })}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={e => update({ age: parseInt(e.target.value) || 0 })}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">Height (cm)</label>
            <input
              type="number"
              value={form.height_cm}
              onChange={e => update({ height_cm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">Weight (kg)</label>
            <input
              type="number"
              value={form.weight_kg}
              onChange={e => update({ weight_kg: parseFloat(e.target.value) || 0 })}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">Gender</label>
          <div className="flex gap-2">
            {(['male', 'female', 'other'] as Gender[]).map(g => (
              <button
                key={g}
                onClick={() => update({ gender: g })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  form.gender === g
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-surface border-border text-text-muted hover:border-primary/30'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-2xl p-6 space-y-5">
        <h3 className="text-text-main font-semibold text-sm">Fitness Preferences</h3>

        <div>
          <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">Primary Goal</label>
          <div className="flex gap-2">
            {(['lose', 'maintain', 'gain'] as Goal[]).map(g => (
              <button
                key={g}
                onClick={() => update({ goal: g })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  form.goal === g
                    ? 'bg-primary/20 border-primary/40 text-text-main'
                    : 'bg-surface border-border text-text-muted hover:border-primary/30'
                }`}
              >
                {goalLabels[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">Activity Level</label>
          <div className="space-y-1.5">
            {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as ActivityLevel[]).map(a => (
              <button
                key={a}
                onClick={() => update({ activity_level: a })}
                className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm transition-all border ${
                  form.activity_level === a
                    ? 'bg-primary/10 border-primary/30 text-text-main font-semibold'
                    : 'bg-surface border-border text-text-muted hover:border-primary/30'
                }`}
              >
                <span>{activityLabels[a]}</span>
                {form.activity_level === a && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">Dietary Preference</label>
          <div className="grid grid-cols-2 gap-2">
            {(['veg', 'non_veg', 'vegan', 'keto'] as DietaryPreference[]).map(d => (
              <button
                key={d}
                onClick={() => update({ dietary_preference: d })}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                  form.dietary_preference === d
                    ? 'bg-primary/20 border-primary/40 text-text-main'
                    : 'bg-surface border-border text-text-muted hover:border-primary/30'
                }`}
              >
                {dietLabels[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 shadow-md"
      >
        {saving ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : saved ? (
          <CheckCircle size={16} />
        ) : (
          <Save size={16} />
        )}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
