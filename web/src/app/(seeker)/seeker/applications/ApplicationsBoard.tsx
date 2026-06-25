'use client';

import * as React from 'react';
import { ClipboardList, FileText } from 'lucide-react';
import {
  Card,
  CardBody,
  Badge,
  Select,
  ModeBadge,
  Alert,
  EmptyState,
  Button,
  LifecycleSteps,
} from '@/components/ui';
import { apiPatch } from '@/lib/api-client';
import type { Application, ApplicationStatus } from '@/lib/domain/types';
import { APP_STATUS_TONE, APPLICATION_FLOW } from '../../_components/status';

const ALL_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
  'Withdrawn',
];

/** Map an application status onto the seeker tracker lifecycle index. */
function flowIndex(status: ApplicationStatus): number {
  const i = APPLICATION_FLOW.indexOf(status);
  return i >= 0 ? i : 0;
}

export function ApplicationsBoard({ initial }: { initial: Application[] }) {
  const [apps, setApps] = React.useState(initial);
  const [error, setError] = React.useState('');
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function changeStatus(id: string, status: ApplicationStatus) {
    setPendingId(id);
    setError('');
    const prev = apps;
    // optimistic
    setApps((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      const updated = await apiPatch<Application>('/api/applications', { id, status });
      setApps((a) => a.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setApps(prev);
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-6 w-6" />}
        title="No applications yet"
        description="When you apply from the job feed, each application is tracked here through the hiring lifecycle."
        action={<Button href="/seeker/jobs">Browse jobs</Button>}
      />
    );
  }

  const counts = APPLICATION_FLOW.map(
    (stage) => apps.filter((a) => a.status === stage).length,
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert tone="error" title="Couldn't update status">
          {error}
        </Alert>
      )}

      {/* Funnel summary */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-5 gap-2 text-center">
            {APPLICATION_FLOW.map((stage, i) => (
              <div key={stage} className="rounded-xl bg-surface-muted px-2 py-3">
                <p className="text-2xl font-bold tabular-nums text-ink">{counts[i]}</p>
                <p className="text-xs text-ink-faint">{stage}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <ul className="space-y-3">
        {apps.map((a) => (
          <Card key={a.id}>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{a.jobTitle}</p>
                  <p className="text-sm text-ink-faint">{a.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={APP_STATUS_TONE[a.status]}>{a.status}</Badge>
                  <div className="w-40">
                    <Select
                      aria-label={`Update status for ${a.jobTitle}`}
                      value={a.status}
                      disabled={pendingId === a.id}
                      onChange={(e) => changeStatus(a.id, e.target.value as ApplicationStatus)}
                      options={ALL_STATUSES.map((s) => ({ value: s, label: s }))}
                    />
                  </div>
                </div>
              </div>

              {a.status !== 'Rejected' && a.status !== 'Withdrawn' && (
                <LifecycleSteps
                  variant="compact"
                  current={flowIndex(a.status)}
                  stages={APPLICATION_FLOW.map((s) => ({
                    key: s,
                    label: s,
                    blurb: '',
                    icon: () => null,
                  }))}
                />
              )}

              {a.coverLetter && (
                <details className="rounded-xl bg-surface-muted px-3.5 py-2.5">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                    <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    Cover letter
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{a.coverLetter}</p>
                </details>
              )}
            </CardBody>
          </Card>
        ))}
      </ul>

      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
        <ModeBadge mode="heuristic" />
        Demo tracker — status changes are stored locally to this seeded session and audited, but no
        emails are sent.
      </p>
    </div>
  );
}
