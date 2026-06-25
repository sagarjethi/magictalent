import * as React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from './cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const config: Record<
  AlertTone,
  { wrap: string; icon: React.ComponentType<{ className?: string }>; iconColor: string; role: 'status' | 'alert' }
> = {
  info: {
    wrap: 'bg-brand-50 border-brand-100 text-brand-900',
    icon: Info,
    iconColor: 'text-brand-600',
    role: 'status',
  },
  success: {
    wrap: 'bg-green-50 border-green-100 text-green-900',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    role: 'status',
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-100 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    role: 'alert',
  },
  error: {
    wrap: 'bg-red-50 border-red-100 text-red-900',
    icon: XCircle,
    iconColor: 'text-red-600',
    role: 'alert',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Optional trailing action (e.g. a small button). */
  action?: React.ReactNode;
  className?: string;
}

/** Alert — inline message banner (info/success/warning/error). Server-compatible. */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const c = config[tone];
  const Icon = c.icon;
  return (
    <div
      role={c.role}
      className={cn('flex gap-3 rounded-xl border px-4 py-3', c.wrap, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', c.iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {children && (
          <div className={cn('text-sm', title ? 'mt-0.5 opacity-90' : '')}>{children}</div>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
