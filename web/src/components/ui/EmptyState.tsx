import * as React from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  /** A lucide icon element (e.g. <Inbox />). */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional CTA (e.g. a <Button>). */
  action?: React.ReactNode;
  className?: string;
  /** Remove the dashed border / padding for inline use. */
  bare?: boolean;
}

/** EmptyState — icon + title + description + optional action. Server-compatible. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  bare = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        bare ? 'py-8' : 'rounded-2xl border border-dashed border-slate-300 bg-surface-muted/50 px-6 py-14',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-faint">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
