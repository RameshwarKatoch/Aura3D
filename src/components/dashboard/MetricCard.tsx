import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  iconColor: string;
  subtext?: string;
  actionNode?: ReactNode;
  onUpdate?: (newValue: number) => void;
}

export default function MetricCard({ label, value, unit, icon, iconColor, subtext, actionNode, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString().replace(/,/g, ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleValueClick = () => {
    if (onUpdate) {
      setTempValue(value.toString().replace(/,/g, ''));
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const num = parseFloat(tempValue);
    if (!isNaN(num)) {
      onUpdate?.(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setTempValue(value.toString().replace(/,/g, ''));
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-panel border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors relative group shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
        {actionNode && (
          <div className="z-10 relative">
            {actionNode}
          </div>
        )}
      </div>
      <div>
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-surface border border-primary/50 rounded px-1.5 py-0.5 text-text-main text-2xl font-bold w-24 outline-none focus:border-primary transition-colors"
            />
          ) : (
            <span 
              onClick={handleValueClick}
              className={`text-text-main text-2xl font-bold ${onUpdate ? 'cursor-edit hover:text-primary transition-colors cursor-pointer underline decoration-dashed decoration-text-muted/20 underline-offset-4' : ''}`}
            >
              {value}
            </span>
          )}
          {unit && <span className="text-text-muted text-sm">{unit}</span>}
        </div>
        {subtext && <p className="text-text-muted text-xs mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
