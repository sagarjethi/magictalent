import type { Metadata } from 'next';
import { getRepo } from '@/lib/db';
import { PageHeader } from '../../../(seeker)/_components/PageHeader';
import { PipelineBoard } from './PipelineBoard';

export const metadata: Metadata = { title: 'Pipeline' };
export const dynamic = 'force-dynamic';

export default function PipelinePage({ searchParams }: { searchParams: { req?: string } }) {
  const repo = getRepo();
  const cards = repo.listPipeline();
  const requisitions = repo.listRequisitions();
  const initialReqId =
    searchParams.req && requisitions.some((r) => r.id === searchParams.req)
      ? searchParams.req
      : 'all';

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Your hiring pipeline"
        description="The 7-stage lifecycle as a Kanban. Move candidates with the per-card selector — accessible, keyboard-friendly, and every transition is audited."
      />
      <PipelineBoard initial={cards} requisitions={requisitions} initialReqId={initialReqId} />
    </div>
  );
}
