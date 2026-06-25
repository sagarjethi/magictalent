'use client';

import * as React from 'react';
import { cn } from './cn';
import {
  FieldShell,
  controlBase,
  controlState,
  describedBy,
} from './Field';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  containerClassName?: string;
}

/** Labelled, accessible multi-line text input. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, id, required, className, containerClassName, rows = 5, ...props },
    ref,
  ) {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const hasError = Boolean(error);
    const hasHint = Boolean(hint);

    return (
      <FieldShell
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy(fieldId, hasError, hasHint)}
          className={cn(
            controlBase,
            controlState(hasError),
            'resize-y py-2.5 leading-relaxed',
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);
