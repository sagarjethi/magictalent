import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, Layers, Radar, Users } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  LifecycleSteps,
  EmptyState,
} from '@/components/ui';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../(seeker)/_components/PageHeader';
import { NewRequisitionForm } from './NewRequisitionForm';
import { STAGE_TO_LIFECYCLE } from '../_components/stage';

export const metadata: Metadata = { title: 'Requisitions' };
export const dynamic = 'force-dynamic';

export default function RequisitionsPage() {
  const repo = getRepo();
  const requisitions = repo.listRequisitions();
  const pipeline = repo.listPipeline();

  return (
    <div>
      <PageHeader
        eyebrow="Requisitions"
        title="Your open roles"
        description="Each requisition is a structured search spec parsed from a JD — the input to the shared matching brain and the Sourcing Agent."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* List */}
        <div className="space-y-4">
          {requisitions.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="No requisitions yet"
              description="Create your first requisition from a job description to start sourcing."
            />
          ) : (
            requisitions.map((req) => {
              const cards = pipeline.filter((c) => c.requisitionId === req.id);
              // Most-advanced active stage to anchor the mini stepper.
              const anchor =
                cards.find((c) => c.stage === 'Interview')?.stage ??
                cards.find((c) => c.stage === 'Screening')?.stage ??
                cards[0]?.stage ??
                'Sourced';
              return (
                <Card key={req.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle>{req.spec.title}</CardTitle>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                          {req.company}
                        </span>
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                          {req.spec.seniority} · {req.spec.minYearsExperience}+ yrs
                        </span>
                        {req.spec.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {req.spec.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge tone={req.status === 'open' ? 'green' : 'slate'}>{req.status}</Badge>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {req.spec.summary && <p className="text-sm text-ink-soft">{req.spec.summary}</p>}

                    <div className="flex flex-wrap gap-1.5">
                      {req.spec.mustHaveSkills.slice(0, 6).map((s) => (
                        <Badge key={s} tone="brand" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-surface-muted/50 px-4 py-4">
                      <LifecycleSteps variant="compact" current={STAGE_TO_LIFECYCLE[anchor]} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {cards.length} in pipeline
                      </span>
                      <div className="ml-auto flex gap-2">
                        <Button href={`/recruiter/find?req=${req.id}`} size="sm" leftIcon={<Radar className="h-4 w-4" />}>
                          Source
                        </Button>
                        <Link
                          href={`/recruiter/pipeline?req=${req.id}`}
                          className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-brand-700 hover:bg-brand-50"
                        >
                          Pipeline →
                        </Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>

        {/* Create */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <NewRequisitionForm />
        </div>
      </div>
    </div>
  );
}
