'use client';

import * as React from 'react';
import { ShieldCheck, AlertOctagon, AlertTriangle, Info, Check, FileSearch } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Textarea,
  Badge,
  ModeBadge,
  ScoreRing,
  Alert,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import type { BadgeTone } from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type { AtsReport } from '@/lib/domain/types';

const SEVERITY: Record<'high' | 'medium' | 'low', { tone: BadgeTone; icon: React.ReactNode; label: string }> = {
  high: { tone: 'red', icon: <AlertOctagon className="h-3 w-3" />, label: 'High' },
  medium: { tone: 'amber', icon: <AlertTriangle className="h-3 w-3" />, label: 'Medium' },
  low: { tone: 'slate', icon: <Info className="h-3 w-3" />, label: 'Low' },
};

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export function AtsClient({ initialResume }: { initialResume: string }) {
  const [resume, setResume] = React.useState(initialResume);
  const [report, setReport] = React.useState<AtsReport | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = React.useState('');

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const r = await apiPost<AtsReport>('/api/ats', { rawResume: resume });
      setReport(r);
      setStatus('done');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  const issues = report
    ? [...report.issues].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Paste your resume</CardTitle>
          <p className="text-sm text-ink-faint">
            We check structure, keyword coverage, and parse-ability — the things applicant-tracking
            systems actually score.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={run} className="space-y-4" aria-busy={status === 'loading'}>
            <Textarea
              label="Resume text"
              required
              rows={14}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your full resume…"
            />
            {status === 'error' && (
              <Alert tone="error" title="Couldn't analyze your resume">
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              loading={status === 'loading'}
              disabled={!resume.trim()}
              leftIcon={<FileSearch className="h-4 w-4" />}
            >
              {status === 'loading' ? 'Analyzing…' : 'Check ATS readiness'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <div>
        {status === 'loading' && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton variant="circle" className="h-20 w-20" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-2/3" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardBody>
          </Card>
        )}

        {status !== 'loading' && !report && (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Your ATS report appears here"
            description="Run the check to get a 0–100 score, prioritized issues with concrete fixes, and what's already working."
          />
        )}

        {status !== 'loading' && report && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>ATS readiness report</CardTitle>
              <ModeBadge mode={report.mode} />
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center gap-4">
                <ScoreRing score={report.score} size={88} showLabel />
                <p className="text-sm text-ink-soft">
                  {report.score >= 80
                    ? 'Your resume should parse cleanly through most ATS filters.'
                    : report.score >= 60
                      ? 'Decent, but a few fixes will meaningfully improve parse-ability.'
                      : 'Several issues are likely hurting how systems read your resume.'}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">
                  Issues to fix ({issues.length})
                </h3>
                {issues.length === 0 ? (
                  <Alert tone="success" title="No blocking issues found">
                    Nice — nothing critical stood out.
                  </Alert>
                ) : (
                  <ul className="space-y-2.5">
                    {issues.map((issue, i) => {
                      const sev = SEVERITY[issue.severity];
                      return (
                        <li key={i} className="rounded-xl border border-slate-200 p-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-ink">{issue.message}</p>
                            <Badge tone={sev.tone} size="sm" icon={sev.icon}>
                              {sev.label}
                            </Badge>
                          </div>
                          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-soft">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                            <span>{issue.fix}</span>
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {report.strengths.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink">What's working</h3>
                  <ul className="space-y-1.5">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
