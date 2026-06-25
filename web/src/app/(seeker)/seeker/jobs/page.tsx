import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { Alert, EmptyState, Button } from '@/components/ui';
import { getRepo } from '@/lib/db';
import { rankJobs } from '@/lib/matching/scorer';
import { CURRENT_SEEKER_ID } from '@/lib/api-client';
import { PageHeader } from '../../_components/PageHeader';
import { JobsBoard } from './JobsBoard';

export const metadata: Metadata = { title: 'Jobs' };
export const dynamic = 'force-dynamic';

export default function JobsPage() {
  const repo = getRepo();
  const seeker = repo.getSeeker(CURRENT_SEEKER_ID);

  if (!seeker) {
    return (
      <div>
        <PageHeader eyebrow="Job feed" title="Jobs ranked for you" />
        <EmptyState
          title="Create a profile first"
          description="We rank every job against your profile — set one up to see your matches."
          action={<Button href="/seeker/profile">Create profile</Button>}
        />
      </div>
    );
  }

  const ranked = rankJobs(seeker.profile, repo.listJobs());
  const appliedJobIds = repo.listApplications(CURRENT_SEEKER_ID).map((a) => a.jobId);

  return (
    <div>
      <PageHeader
        eyebrow="Job feed"
        title="Jobs ranked for you"
        description={`${ranked.length} open roles, each scored by the shared matching brain against ${seeker.name.split(' ')[0]}'s profile.`}
      />
      <Alert tone="info" className="mb-6">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Same score, both sides: the number you see here is the number a recruiter sees for this
          exact pairing.
        </span>
      </Alert>
      <JobsBoard ranked={ranked} appliedJobIds={appliedJobIds} />
    </div>
  );
}
