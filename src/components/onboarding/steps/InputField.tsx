import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  label: string;
  type: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  suffix?: string;
}

export default function InputField({ icon, label, type, value, onChange, placeholder, error, suffix }: Props) {
  return (
    <div>
      <label className="block text-text-muted text-xs font-medium mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-surface border rounded-xl py-3 text-text-main placeholder-text-muted text-sm focus:outline-none focus:border-primary/50 transition-colors ${
            icon ? 'pl-10' : 'pl-4'
          } ${suffix ? 'pr-16' : 'pr-4'} ${error ? 'border-red-500' : 'border-border'}`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">{suffix}</span>
        )}
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
