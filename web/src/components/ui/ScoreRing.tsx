import { cn } from './cn';
import { scoreBand, clampScore } from './score';

export interface ScoreRingProps {
  /** 0–100 match score. */
  score: number;
  /** Outer diameter in px. @default 72 */
  size?: number;
  /** Ring thickness in px. @default 7 */
  thickness?: number;
  /** Show the band label under the number. @default false */
  showLabel?: boolean;
  /** Override the unit suffix (e.g. ''). @default '' */
  className?: string;
}

/**
 * ScoreRing — circular 0–100 match score, colored by band
 * (≥80 green · ≥60 indigo · ≥40 amber · else red). Server-compatible SVG.
 */
export function ScoreRing({
  score,
  size = 72,
  thickness = 7,
  showLabel = false,
  className,
}: ScoreRingProps) {
  const value = clampScore(score);
  const band = scoreBand(value);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  const center = size / 2;
  const fontSize = Math.round(size * 0.3);

  return (
    <div
      className={cn('inline-flex flex-col items-center gap-1', className)}
      role="img"
      aria-label={`Match score ${value} out of 100 — ${band.label}`}
    >
      <span className="relative inline-flex" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-200"
            strokeWidth={thickness}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={band.hex}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center font-bold tabular-nums',
            band.text,
          )}
          style={{ fontSize }}
        >
          {value}
        </span>
      </span>
      {showLabel && (
        <span className={cn('text-xs font-medium', band.text)}>{band.label}</span>
      )}
    </div>
  );
}
