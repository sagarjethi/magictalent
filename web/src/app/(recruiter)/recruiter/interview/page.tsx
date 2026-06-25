import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../../(seeker)/_components/PageHeader';
import { InterviewClient } from './InterviewClient';

export const metadata: Metadata = { title: 'Interview Kit' };
export const dynamic = 'force-dynamic';

export default function InterviewPage() {
  const repo = getRepo();
  const requisitions = repo.listRequisitions().map((r) => ({ id: r.id, title: r.spec.title, company: r.company }));

  if (requisitions.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Interview" title="Interview Kit" />
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Create a requisition first"
          description="The Interview Kit agent tailors questions to a requisition and a candidate."
          action={<Button href="/recruiter">New requisition</Button>}
        />
      </div>
    );
  }

  const candidates = repo
    .internalCandidatePool()
    .map((c) => ({ id: c.id, name: c.name, headline: c.headline }));

  return (
    <div>
      <PageHeader
        eyebrow="Interview · lifecycle stage 4"
        title="Interview Kit"
        description="Generate a tailored, fair interview plan — questions that probe the candidate's real gaps, plus a weighted scorecard. Powered by an agent; works offline in heuristic mode."
      />
      <InterviewClient requisitions={requisitions} candidates={candidates} />
    </div>
  );
}
