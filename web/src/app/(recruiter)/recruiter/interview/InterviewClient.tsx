'use client';

import * as React from 'react';
import { ClipboardList, Sparkles, ListChecks, Target } from 'lucide-react';
import {
  Card, CardBody, CardHeader, CardTitle, Button, Select, Badge, ModeBadge, Alert, Spinner, EmptyState,
} from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type { AgentStep, InterviewKit } from '@/lib/domain/types';
import { AgentTrace } from '../../../(seeker)/_components/AgentTrace';

interface Opt { id: string; title?: string; company?: string; name?: string; headline?: string }

const TYPE_TONE: Record<string, 'brand' | 'green' | 'amber' | 'slate'> = {
  technical: 'brand',
  'system-design': 'amber',
  behavioral: 'green',
  culture: 'slate',
};

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; steps: AgentStep[]; kit: InterviewKit };

export function InterviewClient({
  requisitions,
  candidates,
}: {
  requisitions: Opt[];
  candidates: Opt[];
}) {
  const [reqId, setReqId] = React.useState(requisitions[0]?.id ?? '');
  const [candId, setCandId] = React.useState(candidates[0]?.id ?? '');
  const [run, setRun] = React.useState<RunState>({ phase: 'idle' });

  async function generate() {
    if (!reqId || !candId) return;
    setRun({ phase: 'running' });
    try {
      const data = await apiPost<{ steps: AgentStep[]; kit: InterviewKit }>(
        '/api/agent/interview-kit',
        { requisitionId: reqId, candidateId: candId },
      );
      setRun({ phase: 'done', steps: data.steps, kit: data.kit });
    } catch (e) {
      setRun({ phase: 'error', message: (e as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Select
            label="Requisition"
            value={reqId}
            onChange={(e) => setReqId(e.target.value)}
            options={requisitions.map((r) => ({ value: r.id, label: `${r.title} · ${r.company}` }))}
          />
          <Select
            label="Candidate"
            value={candId}
            onChange={(e) => setCandId(e.target.value)}
            options={candidates.map((c) => ({ value: c.id, label: `${c.name} — ${c.headline}` }))}
          />
          <Button onClick={generate} loading={run.phase === 'running'} leftIcon={<Sparkles className="h-4 w-4" />}>
            Generate kit
          </Button>
        </CardBody>
      </Card>

      {run.phase === 'idle' && (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Ready when you are"
          description="Pick a requisition and a candidate. The agent analyzes the fit, drafts questions that target the real gaps, and builds a weighted scorecard — every step shown."
        />
      )}

      {run.phase === 'running' && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-6 text-sm text-ink-soft">
          <Spinner /> Interview Kit agent is analyzing the fit and drafting questions…
        </div>
      )}

      {run.phase === 'error' && <Alert tone="error">{run.message}</Alert>}

      {run.phase === 'done' && (
        <div className="space-y-6 animate-fade-up">
          <AgentTrace steps={run.steps} mode={run.kit.mode} title="Interview Kit agent reasoning" />

          {/* Focus areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-600" /> Focus areas
                <ModeBadge mode={run.kit.mode} />
              </CardTitle>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              {run.kit.focusAreas.map((f) => (
                <Badge key={f} tone="brand">{f}</Badge>
              ))}
            </CardBody>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-brand-600" /> Tailored questions ({run.kit.questions.length})
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {run.kit.questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={TYPE_TONE[q.type] ?? 'slate'} size="sm">{q.type}</Badge>
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{q.area}</span>
                  </div>
                  <p className="text-sm font-medium text-ink">{q.question}</p>
                  {q.whatToListenFor && (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                      <span className="font-semibold text-ink-soft">Listen for:</span> {q.whatToListenFor}
                    </p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Scorecard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-brand-600" /> Weighted scorecard
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-2.5">
              {run.kit.scorecard.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{c.criterion}</p>
                    {c.rationale && <p className="text-xs text-ink-faint">{c.rationale}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1" aria-label={`weight ${c.weight} of 5`}>
                    {Array.from({ length: 5 }).map((_, n) => (
                      <span
                        key={n}
                        className={n < c.weight ? 'h-2 w-2 rounded-full bg-brand-500' : 'h-2 w-2 rounded-full bg-slate-200'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
