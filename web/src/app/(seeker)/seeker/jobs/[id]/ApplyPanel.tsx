'use client';

import * as React from 'react';
import { Send, CheckCircle2, FileText } from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import { apiPost, getCurrentSeekerId } from '@/lib/api-client';
import type { Application } from '@/lib/domain/types';

export function ApplyPanel({ jobId, alreadyApplied }: { jobId: string; alreadyApplied: boolean }) {
  const [applied, setApplied] = React.useState(alreadyApplied);
  const [coverLetter, setCoverLetter] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function apply() {
    setLoading(true);
    setError('');
    try {
      const app = await apiPost<Application>('/api/applications', {
        seekerId: getCurrentSeekerId(),
        jobId,
        autoCoverLetter: true,
      });
      setApplied(true);
      setCoverLetter(app.coverLetter);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert tone="error" title="Couldn't submit your application">
          {error}
        </Alert>
      )}

      {applied ? (
        <Alert tone="success" title="Application submitted">
          <p>
            Tracked in your applications. We never contact employers on your behalf without you.
          </p>
        </Alert>
      ) : (
        <Button
          onClick={apply}
          loading={loading}
          leftIcon={<Send className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          {loading ? 'Applying & drafting letter…' : 'Apply with a tailored cover letter'}
        </Button>
      )}

      {coverLetter !== null && (
        <div className="rounded-2xl border border-slate-200 bg-surface p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Tailored cover letter (draft)
          </p>
          <p className="whitespace-pre-wrap text-sm text-ink-soft">
            {coverLetter || 'No cover letter text was generated.'}
          </p>
        </div>
      )}

      {applied && coverLetter === null && (
        <p className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
          <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
          You applied to this role earlier.
        </p>
      )}
    </div>
  );
}
