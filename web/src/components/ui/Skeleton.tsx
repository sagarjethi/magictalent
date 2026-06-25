import * as React from 'react';
import { cn } from './cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape preset. @default 'rect' */
  variant?: 'rect' | 'text' | 'circle';
}

/** Skeleton — shimmering loading placeholder. Server-compatible. */
export function Skeleton({ variant = 'rect', className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-slate-200/80',
        variant === 'text' && 'h-4 rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-xl',
        className,
      )}
      {...props}
    />
  );
}
