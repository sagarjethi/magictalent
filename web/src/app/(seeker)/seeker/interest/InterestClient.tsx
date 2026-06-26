'use client';

import * as React from 'react';
import { Inbox, Building2, Mail, Sparkles } from 'lucide-react';
import {
  Card, CardBody, Badge, ScoreRing, Alert, Spinner, EmptyState,
} from '@/components/ui';
import { apiGet, getCurrentSeekerId } from '@/lib/api-client';
import type { PipelineStage } from '@/lib/domain/types';

interface Interest {
  requisitionId: string;
  jobTitle: string;
  company: string;
  stage: PipelineStage;
  matchOverall: number;
  updatedAt: string;
}
interface InterestOutreach {
  id: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent';
  createdAt: string;
}

const STAGE_TONE: Record<string, 'brand' | 'green' | 'amber' | 'slate' | 'red'> = {
  Sourced: 'slate',
  Screening: 'amber',
  Interview: 'brand',
  Selected: 'green',
  Hired: 'green',
  Onboarding: 'green',
  Rejected: 'red',
};

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; interests: Interest[]; outreach: InterestOutreach[] };

export function InterestClient() {
  const [state, setState] = React.useState<State>({ phase: 'loading' });

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiGet<{ interests: Interest[]; outreach: InterestOutreach[] }>(
          `/api/seeker/interest?seekerId=${encodeURIComponent(getCurrentSeekerId())}`,
        );
        if (active) setState({ phase: 'done', interests: data.interests, outreach: data.outreach });
      } catch (e) {
        if (active) setState({ phase: 'error', message: (e as Error).message });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-6 text-sm text-ink-soft">
        <Spinner /> Checking for recruiter interest…
      </div>
    );
  }
  if (state.phase === 'error') return <Alert tone="error">{state.message}</Alert>;

  if (state.interests.length === 0 && state.outreach.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-6 w-6" />}
        title="No recruiter interest yet"
        description="When a recruiter sources you or reaches out, it'll appear here. Keep your profile and ATS score sharp to get noticed."
      />
    );
  }

  return (
    <div className="space-y-8">
      {state.interests.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Building2 className="h-5 w-5 text-brand-600" /> In a recruiter&apos;s pipeline
          </h2>
          {state.interests.map((it) => (
            <Card key={it.requisitionId}>
              <CardBody className="flex items-center gap-4">
                <ScoreRing score={it.matchOverall} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{it.jobTitle}</p>
                  <p className="text-sm text-ink-faint">{it.company}</p>
                </div>
                <div className="text-right">
                  <Badge tone={STAGE_TONE[it.stage] ?? 'slate'}>{it.stage}</Badge>
                  <p className="mt-1 text-xs text-ink-faint">they rank you {it.matchOverall}/100</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </section>
      )}

      {state.outreach.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Mail className="h-5 w-5 text-brand-600" /> Messages from recruiters
          </h2>
          {state.outreach.map((m) => (
            <Card key={m.id}>
              <CardBody>
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-500" aria-hidden="true" />
                  <p className="font-semibold text-ink">{m.subject}</p>
                  <Badge tone={m.status === 'sent' ? 'green' : 'slate'} size="sm">{m.status}</Badge>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{m.body}</p>
              </CardBody>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
