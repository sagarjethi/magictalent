import { cn } from './cn';

export interface SpinnerProps {
  /** Pixel size of the spinner. @default 18 */
  size?: number;
  className?: string;
  /** Accessible label for screen readers. @default 'Loading' */
  label?: string;
}

/** Indeterminate loading spinner. Server-compatible (pure SVG + CSS). */
export function Spinner({ size = 18, className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
