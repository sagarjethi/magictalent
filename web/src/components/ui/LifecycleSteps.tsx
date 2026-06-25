import * as React from 'react';
import {
  Target,
  Megaphone,
  Filter,
  MessagesSquare,
  CheckCheck,
  Handshake,
  Rocket,
  Check,
} from 'lucide-react';
import { cn } from './cn';

/** The canonical 7-stage hiring lifecycle (Identify → Onboard). */
export interface LifecycleStage {
  key: string;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  { key: 'identify', label: 'Identify', blurb: 'Define the need; AI parses the JD into a structured spec.', icon: Target },
  { key: 'attract', label: 'Attract', blurb: 'The Sourcing Agent fans out across sources + your talent pool.', icon: Megaphone },
  { key: 'screen', label: 'Screen', blurb: 'Rank by one explainable match score; review strengths & gaps.', icon: Filter },
  { key: 'interview', label: 'Interview', blurb: 'Track conversations and notes through the pipeline.', icon: MessagesSquare },
  { key: 'select', label: 'Select', blurb: 'AI-assisted comparison; decide with confidence.', icon: CheckCheck },
  { key: 'hire', label: 'Hire', blurb: 'Draft outreach, extend the offer, mark hired.', icon: Handshake },
  { key: 'onboard', label: 'Onboard', blurb: 'Handoff checklist; close the requisition.', icon: Rocket },
];

export interface LifecycleStepsProps {
  /** Active stage index (0-based) or stage key. */
  current?: number | string;
  /** Show stage descriptions under each label. @default false */
  showBlurbs?: boolean;
  /** Compact pipeline-header layout vs roomy marketing layout. @default 'marketing' */
  variant?: 'marketing' | 'compact';
  /** Make steps focusable buttons calling this with the index. */
  onStepClick?: (index: number, stage: LifecycleStage) => void;
  className?: string;
  stages?: LifecycleStage[];
}

/**
 * LifecycleSteps — horizontal stepper visualizing the 7-stage hiring lifecycle
 * with a current/active step. Reused on the landing page and the recruiter
 * pipeline. Steps before `current` render complete; the current step is
 * highlighted; later steps are upcoming.
 */
export function LifecycleSteps({
  current = 0,
  showBlurbs = false,
  variant = 'marketing',
  onStepClick,
  className,
  stages = LIFECYCLE_STAGES,
}: LifecycleStepsProps) {
  const currentIndex =
    typeof current === 'string'
      ? Math.max(0, stages.findIndex((s) => s.key === current))
      : current;

  const compact = variant === 'compact';

  return (
    <ol
      className={cn('flex w-full items-start', className)}
      aria-label="Hiring lifecycle"
    >
      {stages.map((stage, i) => {
        const state =
          i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming';
        const Icon = stage.icon;
        const isLast = i === stages.length - 1;

        const node = (
          <span
            className={cn(
              'relative z-10 flex shrink-0 items-center justify-center rounded-full ring-4 ring-surface-muted transition-colors',
              compact ? 'h-9 w-9' : 'h-12 w-12',
              state === 'complete' && 'bg-brand-600 text-white',
              state === 'current' &&
                'bg-surface text-brand-700 shadow-lift ring-brand-100 outline outline-2 outline-brand-500',
              state === 'upcoming' && 'bg-surface text-slate-400 ring-1 ring-slate-200',
            )}
          >
            {state === 'complete' ? (
              <Check className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
            ) : (
              <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
            )}
          </span>
        );

        return (
          <li
            key={stage.key}
            className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {/* connector from this node's center to the next node's center */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-1/2 h-0.5 w-full -translate-y-1/2',
                  compact ? 'top-[1.125rem]' : 'top-6',
                  i < currentIndex ? 'bg-brand-500' : 'bg-slate-200',
                )}
              />
            )}

            {onStepClick ? (
              <button
                type="button"
                onClick={() => onStepClick(i, stage)}
                className="flex flex-col items-center rounded-xl px-1 focus-visible:outline-none"
                aria-label={`${i + 1}. ${stage.label}`}
              >
                {node}
              </button>
            ) : (
              node
            )}

            <span
              className={cn(
                'mt-2 font-semibold',
                compact ? 'text-xs' : 'text-sm',
                state === 'upcoming' ? 'text-ink-faint' : 'text-ink',
              )}
            >
              <span className="hidden text-ink-faint sm:inline">{i + 1}. </span>
              {stage.label}
            </span>

            {showBlurbs && !compact && (
              <span className="mt-1 hidden max-w-[10rem] text-xs leading-snug text-ink-faint md:block">
                {stage.blurb}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
