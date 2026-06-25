'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';
import {
  FieldShell,
  controlBase,
  controlState,
  describedBy,
} from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  containerClassName?: string;
  /** Convenience: pass options instead of children. */
  options?: SelectOption[];
  /** Optional leading placeholder rendered as a disabled option. */
  placeholder?: string;
}

/** Labelled, accessible native select with a custom chevron. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      hint,
      error,
      id,
      required,
      className,
      containerClassName,
      options,
      placeholder,
      children,
      defaultValue,
      value,
      ...props
    },
    ref,
  ) {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const hasError = Boolean(error);
    const hasHint = Boolean(hint);
    const isUncontrolled = value === undefined;

    return (
      <FieldShell
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={containerClassName}
      >
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            required={required}
            value={value}
            defaultValue={
              defaultValue ?? (placeholder && isUncontrolled ? '' : undefined)
            }
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy(fieldId, hasError, hasHint)}
            className={cn(
              controlBase,
              controlState(hasError),
              'h-11 cursor-pointer appearance-none pr-10',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
        </div>
      </FieldShell>
    );
  },
);
