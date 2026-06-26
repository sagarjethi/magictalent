'use client';

import * as React from 'react';
import { MessagesSquare, Sparkles, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  Card, CardBody, CardHeader, CardTitle, Button, Select, Badge, Alert, Spinner, EmptyState,
} from '@/components/ui';
import { apiPost, getCurrentSeekerId } from '@/lib/api-client';
import type { AgentStep, InterviewPrep, InterviewQuestionType } from '@/lib/domain/types';
import { AgentTrace } from '../../_components/AgentTrace';

const TYPE_TONE: Record<InterviewQuestionType, 'brand' | 'green' | 'amber' | 'slate'> = {
  technical: 'brand',
  'system-design': 'amber',
  behavioral: 'green',
  culture: 'slate',
};

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; steps: AgentStep[]; prep: InterviewPrep };

export function PrepClient({ jobs }: { jobs: { id: string; title: string; company: string }[] }) {
  const [jobId, setJobId] = React.useState(jobs[0]?.id ?? '');
  const [run, setRun] = React.useState<RunState>({ phase: 'idle' });

  async function generate() {
    if (!jobId) return;
    setRun({ phase: 'running' });
    try {
      const data = await apiPost<{ steps: AgentStep[]; prep: InterviewPrep }>(
        '/api/agent/interview-prep',
        { seekerId: getCurrentSeekerId(), jobId },
      );
      setRun({ phase: 'done', steps: data.steps, prep: data.prep });
    } catch (e) {
      setRun({ phase: 'error', message: (e as Error).message });
    }
  }

  if (jobs.length === 0) {
    return <EmptyState icon={<MessagesSquare className="h-6 w-6" />} title="No jobs to prep for yet" description="Browse the job feed first." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Select
            label="Target role"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            options={jobs.map((j) => ({ value: j.id, label: `${j.title} · ${j.company}` }))}
          />
          <Button onClick={generate} loading={run.phase === 'running'} leftIcon={<Sparkles className="h-4 w-4" />}>
            Prep me
          </Button>
        </CardBody>
      </Card>

      {run.phase === 'idle' && (
        <EmptyState
          icon={<MessagesSquare className="h-6 w-6" />}
          title="Let's get you ready"
          description="Pick a role and the agent builds your prep pack — likely questions with tips, talking points to lead with, and gaps to get ahead of."
        />
      )}

      {run.phase === 'running' && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-6 text-sm text-ink-soft">
          <Spinner /> Coaching agent is building your prep pack…
        </div>
      )}

      {run.phase === 'error' && <Alert tone="error">{run.message}</Alert>}

      {run.phase === 'done' && (
        <div className="space-y-6 animate-fade-up">
          <AgentTrace steps={run.steps} mode={run.prep.mode} title="Coaching agent reasoning" />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" /> Lead with these
                </CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {run.prep.talkingPoints.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-soft">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Get ahead of these
                </CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {run.prep.gapsToAddress.map((g, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-soft">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                      {g}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 text-brand-600" /> Likely questions ({run.prep.questions.length})
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {run.prep.questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={TYPE_TONE[q.type] ?? 'slate'} size="sm">{q.type}</Badge>
                  </div>
                  <p className="text-sm font-medium text-ink">{q.question}</p>
                  {q.tip && (
                    <p className="mt-1.5 flex gap-1.5 text-xs leading-relaxed text-ink-faint">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                      <span><span className="font-semibold text-ink-soft">Tip:</span> {q.tip}</span>
                    </p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
