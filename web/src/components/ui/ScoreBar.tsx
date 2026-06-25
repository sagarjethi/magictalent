import { cn } from './cn';
import { scoreBand, clampScore } from './score';

export interface ScoreBarProps {
  /** Row label, e.g. "Skills". */
  label: string;
  /** 0–100 value. */
  value: number;
  /** Color the fill by score band instead of a fixed brand color. @default true */
  banded?: boolean;
  className?: string;
}

/**
 * ScoreBar — a single labelled breakdown bar (e.g. skills / experience /
 * keywords / seniority from a MatchBreakdown). Accessible via aria progressbar.
 */
export function ScoreBar({ label, value, banded = true, className }: ScoreBarProps) {
  const v = clampScore(value);
  const band = scoreBand(v);
  const fill = banded ? band.bg : 'bg-brand-600';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className={cn('font-semibold tabular-nums', banded ? band.text : 'text-ink')}>
          {v}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${v} out of 100`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill)}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
