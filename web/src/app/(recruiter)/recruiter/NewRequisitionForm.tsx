'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, CheckCircle2, MapPin, Layers, Briefcase } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  ModeBadge,
  Alert,
} from '@/components/ui';
import { apiPost } from '@/lib/api-client';
import type { Requisition } from '@/lib/domain/types';

export function NewRequisitionForm() {
  const router = useRouter();
  const [company, setCompany] = React.useState('');
  const [jd, setJd] = React.useState('');
  const [parsed, setParsed] = React.useState<Requisition | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const req = await apiPost<Requisition>('/api/requisitions', {
        company,
        rawDescription: jd,
      });
      setParsed(req);
      setStatus('done');
      setCompany('');
      setJd('');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New requisition</CardTitle>
        <p className="text-sm text-ink-faint">
          Paste a job description — we parse it into a structured search spec. Review it before
          sourcing: confirmation over magic.
        </p>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4" aria-busy={status === 'loading'}>
          <Input
            label="Company"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Northwind Labs"
          />
          <Textarea
            label="Job description"
            required
            rows={8}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full JD here…"
          />

          {status === 'error' && (
            <Alert tone="error" title="Couldn't create the requisition">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            loading={status === 'loading'}
            disabled={!company || !jd}
            leftIcon={<Wand2 className="h-4 w-4" />}
          >
            {status === 'loading' ? 'Parsing JD…' : 'Parse & create requisition'}
          </Button>
        </form>

        {parsed && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Parsed search spec — review before sourcing
              </p>
              <ModeBadge mode="heuristic" />
            </div>
            <p className="text-base font-semibold text-ink">{parsed.spec.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                {parsed.company}
              </span>
              <span className="inline-flex items-center gap-1 capitalize">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {parsed.spec.seniority} · {parsed.spec.minYearsExperience}+ yrs
              </span>
              {parsed.spec.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {parsed.spec.location}
                </span>
              )}
            </p>
            {parsed.spec.mustHaveSkills.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Must-have skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.spec.mustHaveSkills.map((s) => (
                    <Badge key={s} tone="brand" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Button
              href={`/recruiter/find?req=${parsed.id}`}
              size="sm"
              variant="secondary"
              className="mt-4"
            >
              Source candidates for this req →
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
