import type { Metadata } from 'next';
import { getRepo } from '@/lib/db';
import { CURRENT_SEEKER_ID } from '@/lib/api-client';
import { PageHeader } from '../../_components/PageHeader';
import { ApplicationsBoard } from './ApplicationsBoard';

export const metadata: Metadata = { title: 'Applications' };
export const dynamic = 'force-dynamic';

export default function ApplicationsPage() {
  const apps = getRepo().listApplications(CURRENT_SEEKER_ID);
  return (
    <div>
      <PageHeader
        eyebrow="Application tracker"
        title="Every application, one honest pipeline"
        description="This is the candidate's view of the same lifecycle recruiters manage — Applied through Hired, with the off-ramps."
      />
      <ApplicationsBoard initial={apps} />
    </div>
  );
}
