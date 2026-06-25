'use client';

import * as React from 'react';
import { cn } from './cn';
import {
  FieldShell,
  controlBase,
  controlState,
  describedBy,
} from './Field';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Optional explicit id; auto-generated when omitted. */
  id?: string;
  /** Icon rendered inside the field on the left. */
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

/** Labelled, accessible text input with hint/error states. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      hint,
      error,
      id,
      required,
      className,
      containerClassName,
      leftIcon,
      ...props
    },
    ref,
  ) {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const hasError = Boolean(error);
    const hasHint = Boolean(hint);

    const control = (
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy(fieldId, hasError, hasHint)}
        className={cn(
          controlBase,
          controlState(hasError),
          'h-11',
          leftIcon ? 'pl-10' : undefined,
          className,
        )}
        {...props}
      />
    );

    return (
      <FieldShell
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={containerClassName}
      >
        {leftIcon ? (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              {leftIcon}
            </span>
            {control}
          </div>
        ) : (
          control
        )}
      </FieldShell>
    );
  },
);
