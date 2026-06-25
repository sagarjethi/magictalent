import Link from 'next/link';
import {
  Compass,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  ClipboardList,
  FileText,
  Building2,
} from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  ScoreRing,
  ModeBadge,
  Stat,
  EmptyState,
} from '@/components/ui';
import { getRepo } from '@/lib/db';
import { rankJobs } from '@/lib/matching/scorer';
import { CURRENT_SEEKER_ID } from '@/lib/api-client';
import { PageHeader } from '../_components/PageHeader';
import { APP_STATUS_TONE } from '../_components/status';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

/** Heuristic profile completeness (0–100) from the parsed profile. */
function completeness(p: {
  headline: string;
  skills: string[];
  summary: string;
  experience: unknown[];
  location?: string;
  yearsExperience: number;
}): number {
  const checks = [
    Boolean(p.headline),
    p.skills.length >= 3,
    Boolean(p.summary),
    p.experience.length >= 1,
    Boolean(p.location),
    p.yearsExperience > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function SeekerDashboard() {
  const repo = getRepo();
  const seeker = repo.getSeeker(CURRENT_SEEKER_ID);

  if (!seeker) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="No profile yet"
        description="Create your profile to unlock matched jobs and the Career Copilot."
        action={<Button href="/seeker/profile">Create your profile</Button>}
      />
    );
  }

  const pct = completeness(seeker.profile);
  const topJobs = rankJobs(seeker.profile, repo.listJobs()).slice(0, 3);
  const apps = repo.listApplications(CURRENT_SEEKER_ID).slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow={`Welcome back, ${seeker.name.split(' ')[0]}`}
        title="Your job-search snapshot"
        description="Everything here is computed by the same explainable matching brain recruiters use — so a score you see is a score they see."
        actions={
          <Button href="/seeker/copilot" leftIcon={<Sparkles className="h-4 w-4" />}>
            Ask the Copilot
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile completeness */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Profile strength</CardTitle>
            <ModeBadge mode="heuristic" />
          </CardHeader>
          <CardBody className="flex items-center gap-4">
            <ScoreRing score={pct} size={84} showLabel />
            <div className="min-w-0">
              <p className="text-sm text-ink-soft">
                {pct >= 80
                  ? 'Strong — recruiters can see a complete picture.'
                  : 'Add detail so you rank higher and get found.'}
              </p>
              <Button
                href="/seeker/profile"
                variant="secondary"
                size="sm"
                className="mt-3"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Improve profile
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Stat
              icon={<Briefcase className="h-3.5 w-3.5" />}
              label="Open matches"
              value={topJobs.length ? `${rankJobs(seeker.profile, repo.listJobs()).length}` : '0'}
            />
            <Stat
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              label="Applications"
              value={`${repo.listApplications(CURRENT_SEEKER_ID).length}`}
            />
            <Stat
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Top match"
              value={topJobs[0] ? `${topJobs[0].match.overall}%` : '—'}
            />
            <Stat
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Skills tracked"
              value={`${seeker.profile.skills.length}`}
            />
          </CardBody>
        </Card>

        {/* ATS nudge */}
        <Card interactive className="bg-gradient-to-br from-brand-600 to-brand-500 text-white">
          <CardBody className="flex h-full flex-col gap-3">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            <h3 className="text-lg font-semibold">Is your resume ATS-safe?</h3>
            <p className="text-sm text-brand-50">
              Get a 0–100 readiness score with concrete, prioritized fixes before you apply.
            </p>
            <Button
              href="/seeker/ats"
              variant="primary"
              size="sm"
              className="mt-auto self-start bg-white text-brand-700 hover:bg-brand-50"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Run ATS check
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Top matched jobs */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Top matched jobs</h2>
          <Link href="/seeker/jobs" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            View all jobs →
          </Link>
        </div>
        {topJobs.length === 0 ? (
          <EmptyState
            icon={<Compass className="h-6 w-6" />}
            title="No jobs to match yet"
            description="Once jobs are available they'll be ranked for you here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {topJobs.map(({ job, match }) => (
              <Card key={job.id} interactive className="flex flex-col">
                <CardBody className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{job.spec.title}</p>
                      <p className="flex items-center gap-1 truncate text-sm text-ink-faint">
                        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {job.company}
                      </p>
                    </div>
                    <ScoreRing score={match.overall} size={52} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.spec.mustHaveSkills.slice(0, 3).map((s) => (
                      <Badge key={s} tone="brand" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <ModeBadge mode={match.mode} />
                    <Link
                      href={`/seeker/jobs/${job.id}`}
                      className="text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      View & apply →
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent applications */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applications</h2>
          <Link
            href="/seeker/applications"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Open tracker →
          </Link>
        </div>
        {apps.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="No applications yet"
            description="Apply from the job feed and your applications will appear here."
            action={<Button href="/seeker/jobs">Browse jobs</Button>}
          />
        ) : (
          <Card>
            <ul className="divide-y divide-slate-100">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{a.jobTitle}</p>
                    <p className="truncate text-xs text-ink-faint">{a.company}</p>
                  </div>
                  <Badge tone={APP_STATUS_TONE[a.status]}>{a.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
