interface RingProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}

function Ring({ value, max, label, unit, color }: RingProps) {
  const pct = Math.min(1, value / max);
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1f1f1f" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${offset}`}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-sm leading-none">{value}</span>
          <span className="text-[#6b7280] text-[9px]">{unit}</span>
        </div>
      </div>
      <span className="text-[#9ca3af] text-xs">{label}</span>
    </div>
  );
}

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export default function MacroRings({ protein, carbs, fat, calories }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Ring value={calories} max={3000} label="Calories" unit="kcal" color="#10b981" />
      <Ring value={protein} max={250} label="Protein" unit="g" color="#3b82f6" />
      <Ring value={carbs} max={400} label="Carbs" unit="g" color="#f59e0b" />
      <Ring value={fat} max={150} label="Fat" unit="g" color="#ef4444" />
    </div>
  );
}
