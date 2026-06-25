import * as React from 'react';
import { cn } from './cn';

/**
 * Shared label / hint / error scaffolding for form controls.
 * Internal helper used by Input, Textarea and Select.
 */
export interface FieldShellProps {
  id: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink-soft"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-faint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Shared control classes for input-like elements. */
export const controlBase =
  'w-full rounded-xl border bg-surface px-3.5 text-sm text-ink shadow-sm ' +
  'placeholder:text-ink-faint transition-colors duration-150 ' +
  'focus:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-faint';

export function controlState(error?: boolean) {
  return error
    ? 'border-red-400 focus:border-red-500'
    : 'border-slate-300 hover:border-slate-400 focus:border-brand-500';
}

/** Build aria-describedby from optional hint/error ids. */
export function describedBy(id: string, hasError?: boolean, hasHint?: boolean) {
  if (hasError) return `${id}-error`;
  if (hasHint) return `${id}-hint`;
  return undefined;
}
