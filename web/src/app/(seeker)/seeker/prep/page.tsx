import type { Metadata } from 'next';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../_components/PageHeader';
import { PrepClient } from './PrepClient';

export const metadata: Metadata = { title: 'Interview Prep' };
export const dynamic = 'force-dynamic';

export default function PrepPage() {
  const jobs = getRepo()
    .listJobs()
    .map((j) => ({ id: j.id, title: j.spec.title, company: j.company }));

  return (
    <div>
      <PageHeader
        eyebrow="Interview Prep"
        title="Walk in ready"
        description="Pick a role you're targeting and the agent predicts likely questions, the strengths to lead with, and the gaps to get ahead of — all from your profile versus the job. Works offline in heuristic mode."
      />
      <PrepClient jobs={jobs} />
    </div>
  );
}
