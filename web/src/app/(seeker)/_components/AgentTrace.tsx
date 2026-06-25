'use client';

import * as React from 'react';
import { ChevronDown, Bot, Wrench } from 'lucide-react';
import { Badge, ModeBadge, cn } from '@/components/ui';
import type { AgentStep, ResultMode } from '@/lib/domain/types';

export interface AgentTraceProps {
  steps: AgentStep[];
  mode?: ResultMode;
  /** Heading, e.g. "Sourcing Agent reasoning". */
  title?: string;
  /** Start expanded. @default true */
  defaultOpen?: boolean;
}

/**
 * AgentTrace — a transparent, collapsible view of an agent's tool-using steps.
 * Surfaces the "show your work" guarantee: every agentic action is auditable.
 * Powered by a LangGraph agent on the server.
 */
export function AgentTrace({ steps, mode, title = 'Agent reasoning', defaultOpen = true }: AgentTraceProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const panelId = React.useId();

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface-muted/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-slate-100/60"
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-card">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            {title}
            {mode && <ModeBadge mode={mode} />}
          </span>
          <span className="text-xs text-ink-faint">
            {steps.length} step{steps.length === 1 ? '' : 's'} · LangGraph agent · transparent by design
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-ink-faint transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ol id={panelId} className="space-y-0 border-t border-slate-200 px-4 py-3">
          {steps.length === 0 && (
            <li className="py-2 text-sm text-ink-faint">No steps were recorded for this run.</li>
          )}
          {steps.map((s, i) => (
            <li key={s.step} className="relative flex gap-3 pb-4 last:pb-0">
              {/* connector */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-px bg-slate-200"
                />
              )}
              <span className="relative z-10 mt-0.5 inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-brand-50 text-[0.6875rem] font-bold text-brand-700 ring-1 ring-inset ring-brand-100 tabular-nums">
                {s.step}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="slate" size="sm" icon={<Wrench className="h-3 w-3" aria-hidden="true" />}>
                    {s.tool}
                  </Badge>
                  <span className="text-sm font-medium text-ink">{s.summary}</span>
                </div>
                {s.detail && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{s.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
