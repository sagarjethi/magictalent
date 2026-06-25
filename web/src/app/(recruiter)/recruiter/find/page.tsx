import type { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../../(seeker)/_components/PageHeader';
import { FindClient } from './FindClient';

export const metadata: Metadata = { title: 'Find candidates' };
export const dynamic = 'force-dynamic';

export default function FindPage({ searchParams }: { searchParams: { req?: string } }) {
  const requisitions = getRepo().listRequisitions();

  if (requisitions.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Sourcing" title="Find candidates" />
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="Create a requisition first"
          description="The Sourcing Agent searches against a requisition's parsed spec."
          action={<Button href="/recruiter">New requisition</Button>}
        />
      </div>
    );
  }

  const initialReqId =
    searchParams.req && requisitions.some((r) => r.id === searchParams.req)
      ? searchParams.req
      : requisitions[0].id;

  return (
    <div>
      <PageHeader
        eyebrow="Sourcing Agent"
        title="Source, ranked and explained"
        description="One click runs a real tool-using LangGraph agent: parse the spec, fan out to GitHub + your talent pool, normalize, dedupe, and rank — then propose a shortlist for your review."
      />
      <FindClient requisitions={requisitions} initialReqId={initialReqId} />
    </div>
  );
}
