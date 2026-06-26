import type { Metadata } from 'next';
import { Video } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../../(seeker)/_components/PageHeader';
import { InterviewsClient } from './InterviewsClient';

export const metadata: Metadata = { title: 'Video Interviews' };
export const dynamic = 'force-dynamic';

export default function InterviewsPage() {
  const repo = getRepo();
  const requisitions = repo.listRequisitions().map((r) => ({ id: r.id, title: r.spec.title, company: r.company }));

  if (requisitions.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Interview · lifecycle stage 4" title="Video Interviews" />
        <EmptyState
          icon={<Video className="h-6 w-6" />}
          title="Create a requisition first"
          description="Schedule browser-based video interviews against a requisition and its pipeline candidates."
          action={<Button href="/recruiter">New requisition</Button>}
        />
      </div>
    );
  }

  // Candidates available per requisition come from the pipeline (people already sourced/screened).
  const candidatesByReq: Record<string, { id: string; name: string }[]> = {};
  for (const r of requisitions) {
    candidatesByReq[r.id] = repo
      .listPipeline(r.id)
      .map((c) => ({ id: c.candidate.id, name: c.candidate.name }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Interview · lifecycle stage 4"
        title="Video Interviews"
        description="Schedule a browser video interview, notify the candidate by email/SMS, run the call in-browser with recording + live transcription, then generate an AI debrief — all end-to-end."
      />
      <InterviewsClient requisitions={requisitions} candidatesByReq={candidatesByReq} />
    </div>
  );
}
