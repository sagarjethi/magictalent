import type { Metadata } from 'next';
import { getRepo } from '@/lib/db';
import { CURRENT_SEEKER_ID } from '@/lib/api-client';
import { PageHeader } from '../../_components/PageHeader';
import { AtsClient } from './AtsClient';

export const metadata: Metadata = { title: 'ATS Check' };
export const dynamic = 'force-dynamic';

export default function AtsPage() {
  const seeker = getRepo().getSeeker(CURRENT_SEEKER_ID);
  return (
    <div>
      <PageHeader
        eyebrow="Resume ATS check"
        title="Beat the bots before a human ever reads it"
        description="Most resumes are filtered by software first. Get an honest readiness score and concrete fixes — no AI key required, falls back to a deterministic heuristic."
      />
      <AtsClient initialResume={seeker?.rawResume ?? ''} />
    </div>
  );
}
