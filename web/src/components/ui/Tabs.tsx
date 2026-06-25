'use client';

import * as React from 'react';
import { cn } from './cn';

export interface TabItem {
  /** Unique value/key for the tab. */
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled active value. */
  value?: string;
  /** Default active value (uncontrolled). Defaults to first item. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Render content per tab. Receives the active value. */
  children?: (activeValue: string) => React.ReactNode;
  /** Accessible label for the tablist. */
  'aria-label'?: string;
  className?: string;
  variant?: 'underline' | 'pill';
}

/**
 * Tabs — accessible tablist/tab/panel with roving focus + arrow-key navigation
 * (Left/Right/Home/End), per WAI-ARIA Authoring Practices.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  variant = 'underline',
  ...rest
}: TabsProps) {
  const firstEnabled = items.find((i) => !i.disabled)?.value ?? items[0]?.value;
  const [internal, setInternal] = React.useState(defaultValue ?? firstEnabled);
  const active = value ?? internal;
  const baseId = React.useId();
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabled = items.filter((i) => !i.disabled);
    const pos = enabled.findIndex((i) => i.value === items[index].value);
    let next: TabItem | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = enabled[(pos + 1) % enabled.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = enabled[(pos - 1 + enabled.length) % enabled.length];
    } else if (e.key === 'Home') {
      next = enabled[0];
    } else if (e.key === 'End') {
      next = enabled[enabled.length - 1];
    } else {
      return;
    }
    if (next) {
      e.preventDefault();
      select(next.value);
      tabRefs.current[next.value]?.focus();
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={rest['aria-label']}
        className={cn(
          'flex gap-1',
          variant === 'underline'
            ? 'border-b border-slate-200'
            : 'rounded-xl bg-slate-100 p-1',
        )}
      >
        {items.map((item, i) => {
          const selected = item.value === active;
          return (
            <button
              key={item.value}
              ref={(el) => {
                tabRefs.current[item.value] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors disabled:opacity-40',
                variant === 'underline'
                  ? cn(
                      '-mb-px border-b-2 px-3.5 py-2.5',
                      selected
                        ? 'border-brand-600 text-brand-700'
                        : 'border-transparent text-ink-faint hover:border-slate-300 hover:text-ink',
                    )
                  : cn(
                      'flex-1 justify-center rounded-lg px-3.5 py-2',
                      selected
                        ? 'bg-surface text-ink shadow-sm'
                        : 'text-ink-faint hover:text-ink',
                    ),
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
      {children && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active}`}
          aria-labelledby={`${baseId}-tab-${active}`}
          tabIndex={0}
          className="mt-5 focus-visible:outline-none"
        >
          {children(active)}
        </div>
      )}
    </div>
  );
}
