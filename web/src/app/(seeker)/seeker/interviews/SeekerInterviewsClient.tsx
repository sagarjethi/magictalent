'use client';

import * as React from 'react';
import { Video, Clock, DoorOpen, CalendarCheck } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Alert, Spinner, EmptyState,
} from '@/components/ui';
import { apiGet, getCurrentSeekerId } from '@/lib/api-client';
import type { InterviewSession, InterviewStatus } from '@/lib/domain/types';
import { InterviewReportCard } from '@/components/InterviewReportCard';

const STATUS_TONE: Record<InterviewStatus, 'brand' | 'green' | 'amber' | 'slate' | 'red'> = {
  scheduled: 'amber',
  'in-progress': 'brand',
  recorded: 'brand',
  completed: 'green',
  cancelled: 'red',
};

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; sessions: InterviewSession[] };

export function SeekerInterviewsClient() {
  const [state, setState] = React.useState<State>({ phase: 'loading' });

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessions = await apiGet<InterviewSession[]>(
          `/api/seeker/interviews?seekerId=${encodeURIComponent(getCurrentSeekerId())}`,
        );
        if (active) setState({ phase: 'done', sessions });
      } catch (e) {
        if (active) setState({ phase: 'error', message: (e as Error).message });
      }
    })();
    return () => { active = false; };
  }, []);

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-muted/50 px-4 py-6 text-sm text-ink-soft">
        <Spinner /> Checking your interviews…
      </div>
    );
  }
  if (state.phase === 'error') return <Alert tone="error">{state.message}</Alert>;

  if (state.sessions.length === 0) {
    return (
      <EmptyState
        icon={<Video className="h-6 w-6" />}
        title="No interviews scheduled"
        description="When a recruiter invites you to a video interview, you'll find the join link and details right here."
      />
    );
  }

  const joinable = (s: InterviewSession) => s.status === 'scheduled' || s.status === 'in-progress';

  return (
    <div className="space-y-4">
      {state.sessions.map((s) => (
        <Card key={s.id}>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{s.jobTitle}</p>
                  <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                </div>
                <p className="text-sm text-ink-faint">{s.company}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                  <Clock className="h-3.5 w-3.5" /> {fmt(s.scheduledAt)} · {s.durationMins} min
                </p>
              </div>
              {joinable(s) ? (
                <Button href={`/room/${s.id}`} leftIcon={<DoorOpen className="h-4 w-4" />}>
                  Join interview
                </Button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-ink-faint">
                  <CalendarCheck className="h-4 w-4" /> {s.status === 'completed' ? 'Completed' : 'Closed'}
                </span>
              )}
            </div>

            {s.invites.length > 0 && (
              <p className="rounded-xl bg-surface-muted/60 px-3 py-2 text-sm text-ink-soft">
                {s.invites[s.invites.length - 1].body.split('\n')[0]}
              </p>
            )}

            {s.report && <InterviewReportCard report={s.report} />}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
