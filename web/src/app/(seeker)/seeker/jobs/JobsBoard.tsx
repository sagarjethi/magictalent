'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, MapPin, Search, Send, CheckCircle2, ChevronDown, Compass } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Input,
  ScoreRing,
  ModeBadge,
  Alert,
  EmptyState,
  cn,
} from '@/components/ui';
import { apiPost, getCurrentSeekerId } from '@/lib/api-client';
import type { RankedJob, Application } from '@/lib/domain/types';
import { MatchDetails } from '../../_components/MatchDetails';

type ApplyState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'done'; coverLetter: string }
  | { phase: 'error'; message: string };

export function JobsBoard({
  ranked,
  appliedJobIds,
}: {
  ranked: RankedJob[];
  appliedJobIds: string[];
}) {
  const [query, setQuery] = React.useState('');
  const [applied, setApplied] = React.useState<Set<string>>(new Set(appliedJobIds));
  const [states, setStates] = React.useState<Record<string, ApplyState>>({});
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const filtered = ranked.filter(({ job }) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      job.spec.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.spec.mustHaveSkills.some((s) => s.toLowerCase().includes(q))
    );
  });

  async function apply(jobId: string) {
    setStates((s) => ({ ...s, [jobId]: { phase: 'loading' } }));
    try {
      const app = await apiPost<Application>('/api/applications', {
        seekerId: getCurrentSeekerId(),
        jobId,
        autoCoverLetter: true,
      });
      setApplied((prev) => new Set(prev).add(jobId));
      setStates((s) => ({ ...s, [jobId]: { phase: 'done', coverLetter: app.coverLetter } }));
    } catch (err) {
      setStates((s) => ({ ...s, [jobId]: { phase: 'error', message: (err as Error).message } }));
    }
  }

  function toggle(jobId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-5 max-w-md">
        <Input
          label="Search jobs"
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Title, company, or skill…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title="No jobs match your search"
          description="Try a different title, company, or skill."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(({ job, match }) => {
            const isApplied = applied.has(job.id);
            const state = states[job.id] ?? { phase: 'idle' };
            const isOpen = expanded.has(job.id);
            return (
              <Card key={job.id}>
                <CardBody className="space-y-4">
                  <div className="flex items-start gap-4">
                    <ScoreRing score={match.overall} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-ink">{job.spec.title}</h3>
                        <ModeBadge mode={match.mode} />
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-faint">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {job.company}
                        </span>
                        {job.spec.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {job.spec.location}
                          </span>
                        )}
                        {job.spec.remote && <Badge tone="green" size="sm">Remote</Badge>}
                        {job.salaryRange && <span className="font-medium text-ink-soft">{job.salaryRange}</span>}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.spec.mustHaveSkills.slice(0, 5).map((s) => (
                          <Badge key={s} tone="brand" size="sm">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(job.id)}
                    aria-expanded={isOpen}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                    {isOpen ? 'Hide match breakdown' : 'Why this fits / gaps'}
                  </button>

                  {isOpen && <MatchDetails match={match} showReasoning />}

                  {state.phase === 'error' && (
                    <Alert tone="error" title="Couldn't submit your application">
                      {state.message}
                    </Alert>
                  )}

                  {state.phase === 'done' && (
                    <Alert tone="success" title="Applied — with an auto-drafted cover letter">
                      <p className="mb-2">
                        We tailored a first-draft cover letter from your profile and this job spec.
                        Review it any time in your tracker. Nothing is sent to the employer
                        automatically.
                      </p>
                      <details className="rounded-lg bg-surface/60 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-ink">
                          View tailored cover letter
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
                          {state.coverLetter || 'No cover letter text was generated.'}
                        </p>
                      </details>
                    </Alert>
                  )}

                  <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Applied
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        loading={state.phase === 'loading'}
                        onClick={() => apply(job.id)}
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        {state.phase === 'loading' ? 'Applying…' : 'Apply with tailored letter'}
                      </Button>
                    )}
                    <Link
                      href={`/seeker/jobs/${job.id}`}
                      className="text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      View details →
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
