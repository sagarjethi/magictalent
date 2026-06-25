import * as React from 'react';
import { cn } from '@/components/ui';

export interface LogoProps {
  /** Show the "Jobmagic" wordmark beside the mark. @default true */
  showWordmark?: boolean;
  /** Pixel size of the square mark. @default 28 */
  size?: number;
  className?: string;
}

/**
 * Jobmagic logo — a custom geometric "spark/compass" mark (two interlocking
 * chevrons forming an upward spark = matching two sides), plus the wordmark.
 * Pure SVG, no external asset, inherits currentColor where useful.
 */
export function Logo({ showWordmark = true, size = 28, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className="relative inline-flex items-center justify-center rounded-xl shadow-card"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          role="img"
          aria-label="Jobmagic"
        >
          <defs>
            <linearGradient id="jm-logo-grad" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="9" fill="url(#jm-logo-grad)" />
          {/* upward spark: two stacked chevrons (seeker ⇄ recruiter meeting) */}
          <path
            d="M9 18.5 L16 11 L23 18.5"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 22.5 L16 18 L20.5 22.5"
            fill="none"
            stroke="white"
            strokeOpacity="0.65"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-ink">
          Job<span className="text-gradient-brand">magic</span>
        </span>
      )}
    </span>
  );
}
