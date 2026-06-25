import * as React from 'react';
import { cn } from './cn';

export type BadgeTone = 'brand' | 'green' | 'amber' | 'red' | 'slate';
export type BadgeSize = 'sm' | 'md';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  green: 'bg-green-50 text-green-700 ring-green-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.6875rem]',
  md: 'px-2.5 py-1 text-xs',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Optional leading icon (e.g. a lucide icon). */
  icon?: React.ReactNode;
}

/** Compact status / category label. Server-compatible. */
export function Badge({
  tone = 'slate',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset',
        tones[tone],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
