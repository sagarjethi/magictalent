import * as React from 'react';
import { cn } from './cn';

export interface StatProps {
  /** The headline figure, e.g. "92%" or "1,284". */
  value: React.ReactNode;
  /** Caption under the figure. */
  label: React.ReactNode;
  /** Optional icon shown beside the label. */
  icon?: React.ReactNode;
  /** Optional trend / delta line, e.g. "+12% vs last week". */
  trend?: React.ReactNode;
  /** Trend direction colors the trend text. @default 'neutral' */
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}

/** Stat — a big number + label for analytics dashboards. Server-compatible. */
export function Stat({
  value,
  label,
  icon,
  trend,
  trendDirection = 'neutral',
  className,
}: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-3xl font-bold tracking-tight text-ink tabular-nums">
        {value}
      </span>
      {trend && (
        <span
          className={cn('text-xs font-medium', {
            'text-green-600': trendDirection === 'up',
            'text-red-600': trendDirection === 'down',
            'text-ink-faint': trendDirection === 'neutral',
          })}
        >
          {trend}
        </span>
      )}
    </div>
  );
}
