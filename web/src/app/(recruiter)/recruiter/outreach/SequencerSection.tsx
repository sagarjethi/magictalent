'use client';

import * as React from 'react';
import { CalendarClock, Sparkles, Mail, MessageSquare, Linkedin } from 'lucide-react';
import {
  Card, CardBody, CardHeader, CardTitle, Button, Select, Badge, Alert, Spinner,
} from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type { AgentStep, OutreachSequence, OutreachChannel } from '@/lib/domain/types';
import { AgentTrace } from '../../../(seeker)/_components/AgentTrace';

interface Opt { id: string; name?: string; label?: string }

const CHANNEL_ICON: Record<OutreachChannel, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" aria-hidden="true" />,
  inmail: <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />,
  sms: <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />,
};

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; steps: AgentStep[]; sequence: OutreachSequence };

export function SequencerSection({
  candidates,
  requisitions,
}: {
  candidates: Opt[];
  requisitions: Opt[];
}) {
  const [reqId, setReqId] = React.useState(requisitions[0]?.id ?? '');
  const [candId, setCandId] = React.useState(candidates[0]?.id ?? '');
  const [run, setRun] = React.useState<RunState>({ phase: 'idle' });

  async function generate() {
    if (!reqId || !candId) return;
    setRun({ phase: 'running' });
    try {
      const data = await apiPost<{ steps: AgentStep[]; sequence: OutreachSequence }>(
        '/api/agent/outreach-sequence',
        { requisitionId: reqId, candidateId: candId },
      );
      setRun({ phase: 'done', steps: data.steps, sequence: data.sequence });
    } catch (e) {
      setRun({ phase: 'error', message: (e as Error).message });
    }
  }

  return (
    <section className="mt-10 space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Sequencer · lifecycle stage 6
        </span>
        <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-ink">
          <CalendarClock className="h-5 w-5 text-brand-600" /> Multi-touch outreach cadence
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-faint">
          The agent plans a respectful, timed follow-up sequence — initial touch plus nudges — each with
          a goal. You review and edit; nothing is sent in this MVP (drafts only, audited).
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Select
            label="Requisition"
            value={reqId}
            onChange={(e) => setReqId(e.target.value)}
            options={requisitions.map((r) => ({ value: r.id, label: r.label ?? r.id }))}
          />
          <Select
            label="Candidate"
            value={candId}
            onChange={(e) => setCandId(e.target.value)}
            options={candidates.map((c) => ({ value: c.id, label: c.name ?? c.id }))}
          />
          <Button onClick={generate} loading={run.phase === 'running'} leftIcon={<Sparkles className="h-4 w-4" />}>
            Generate sequence
          </Button>
        </CardBody>
      </Card>

      {run.phase === 'running' && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-6 text-sm text-ink-soft">
          <Spinner /> Sequencer agent is planning the cadence…
        </div>
      )}

      {run.phase === 'error' && <Alert tone="error">{run.message}</Alert>}

      {run.phase === 'done' && (
        <div className="space-y-5 animate-fade-up">
          <AgentTrace steps={run.steps} mode={run.sequence.mode} title="Sequencer agent reasoning" />
          <ol className="space-y-4">
            {run.sequence.steps.map((s, i) => (
              <li key={i} className="relative rounded-2xl border border-slate-200 bg-surface p-5 shadow-card">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="brand" size="sm">{i === 0 ? 'Day 0 · initial' : `Day +${s.dayOffset}`}</Badge>
                  <Badge tone="slate" size="sm" icon={CHANNEL_ICON[s.channel]}>{s.channel}</Badge>
                  {s.goal && <span className="text-xs text-ink-faint">{s.goal}</span>}
                </div>
                <p className="text-sm font-semibold text-ink">{s.subject}</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
