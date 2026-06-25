import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, MapPin, ArrowLeft } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  ScoreRing,
  ModeBadge,
  EmptyState,
  Button,
} from '@/components/ui';
import { getRepo } from '@/lib/db';
import { scoreMatch } from '@/lib/matching/scorer';
import { CURRENT_SEEKER_ID } from '@/lib/api-client';
import { MatchDetails } from '../../../_components/MatchDetails';
import { ApplyPanel } from './ApplyPanel';

export const metadata: Metadata = { title: 'Job detail' };
export const dynamic = 'force-dynamic';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const repo = getRepo();
  const job = repo.getJob(id);
  if (!job) notFound();

  const seeker = repo.getSeeker(CURRENT_SEEKER_ID);
  const alreadyApplied = repo.listApplications(CURRENT_SEEKER_ID).some((a) => a.jobId === id);

  return (
    <div className="max-w-3xl">
      <Link
        href="/seeker/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to jobs
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle as="h2" className="text-xl">
                {job.spec.title}
              </CardTitle>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  {job.company}
                </span>
                {job.spec.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {job.spec.location}
                  </span>
                )}
                {job.spec.remote && <Badge tone="green" size="sm">Remote</Badge>}
                {job.salaryRange && <span className="font-medium text-ink-soft">{job.salaryRange}</span>}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {job.spec.summary && <p className="text-ink-soft">{job.spec.summary}</p>}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Must-have skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {job.spec.mustHaveSkills.map((s) => (
                <Badge key={s} tone="brand">
                  {s}
                </Badge>
              ))}
            </div>
            {job.spec.niceToHaveSkills.length > 0 && (
              <>
                <h3 className="mb-2 mt-3 text-sm font-semibold text-ink">Nice to have</h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.spec.niceToHaveSkills.map((s) => (
                    <Badge key={s} tone="slate">
                      {s}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {job.rawDescription && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink">Full description</h3>
              <p className="whitespace-pre-wrap text-sm text-ink-soft">{job.rawDescription}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Match + apply */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Your match</CardTitle>
          {seeker && <ModeBadge mode="heuristic" />}
        </CardHeader>
        <CardBody className="space-y-6">
          {!seeker ? (
            <EmptyState
              bare
              title="Create a profile to see your match"
              action={<Button href="/seeker/profile">Create profile</Button>}
            />
          ) : (
            <>
              {(() => {
                const match = scoreMatch(job.spec, seeker.profile);
                return (
                  <>
                    <div className="flex items-center gap-4">
                      <ScoreRing score={match.overall} size={80} showLabel />
                      <p className="text-sm text-ink-soft">
                        Scored against {seeker.name}&apos;s profile — the identical computation a
                        recruiter sees for this pairing.
                      </p>
                    </div>
                    <MatchDetails match={match} showReasoning />
                  </>
                );
              })()}
              <div className="border-t border-slate-100 pt-5">
                <ApplyPanel jobId={job.id} alreadyApplied={alreadyApplied} />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
