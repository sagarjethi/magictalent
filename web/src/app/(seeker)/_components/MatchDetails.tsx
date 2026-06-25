import { Check, AlertTriangle } from 'lucide-react';
import { ScoreBar } from '@/components/ui';
import type { MatchResult } from '@/lib/domain/types';

/**
 * MatchDetails — the explainable breakdown shared by both portals: the 4 score
 * bars plus strengths / gaps lists. Pure + server-compatible.
 */
export function MatchDetails({
  match,
  showReasoning = false,
}: {
  match: MatchResult;
  showReasoning?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <ScoreBar label="Skills" value={match.breakdown.skills} />
        <ScoreBar label="Experience" value={match.breakdown.experience} />
        <ScoreBar label="Keywords" value={match.breakdown.keywords} />
        <ScoreBar label="Seniority" value={match.breakdown.seniority} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SignalList tone="strength" title="Why this fits" items={match.strengths} />
        <SignalList tone="gap" title="Gaps to consider" items={match.gaps} />
      </div>

      {showReasoning && match.reasoning && (
        <div className="rounded-xl bg-surface-muted px-3.5 py-3 text-sm">
          <p className="font-medium text-ink">How this score was made</p>
          <p className="mt-1 text-ink-faint">{match.reasoning}</p>
        </div>
      )}
    </div>
  );
}

function SignalList({
  tone,
  title,
  items,
}: {
  tone: 'strength' | 'gap';
  title: string;
  items: string[];
}) {
  const strength = tone === 'strength';
  const Icon = strength ? Check : AlertTriangle;
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3.5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
            <Icon
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${strength ? 'text-green-600' : 'text-amber-600'}`}
              aria-hidden="true"
            />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
