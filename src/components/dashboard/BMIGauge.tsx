import type { BMIData } from '../../types';

interface Props {
  bmi: BMIData;
}

export default function BMIGauge({ bmi }: Props) {
  const minBMI = 15;
  const maxBMI = 40;
  const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi.value));
  const pct = (clampedBMI - minBMI) / (maxBMI - minBMI);

  const radius = 70;
  const strokeWidth = 10;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const sweepAngle = 240;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, sweep: number) => {
    const s = toRad(start);
    const e = toRad(start + sweep);
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy + radius * Math.sin(e);
    const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + pct * sweepAngle;
  const needleRad = toRad(needleAngle);
  const needleLen = 52;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const circumference = (sweepAngle / 360) * 2 * Math.PI * radius;
  const dashArray = circumference;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="180" height="130" viewBox="0 0 180 130">
          <path
            d={arcPath(startAngle, sweepAngle)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={arcPath(startAngle, sweepAngle)}
            fill="none"
            stroke={bmi.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dashArray}`}
            strokeDashoffset={`${dashOffset}`}
            style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
          />
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#1F2937"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill="#1F2937" />
          <text x={cx} y={cy + 30} textAnchor="middle" fill="#1F2937" fontSize="22" fontWeight="700">
            {bmi.value}
          </text>
          <text x={cx} y={cy + 46} textAnchor="middle" fill="#6B7280" fontSize="10">
            BMI
          </text>
        </svg>
      </div>
      <div className="text-center -mt-2">
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: `${bmi.color}20`, color: bmi.color }}
        >
          {bmi.category}
        </span>
        <p className="text-text-muted text-xs mt-1">Health Risk: {bmi.risk}</p>
      </div>
    </div>
  );
}
