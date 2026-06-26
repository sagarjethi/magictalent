import type { Metadata } from 'next';
import { PageHeader } from '../../_components/PageHeader';
import { InterestClient } from './InterestClient';

export const metadata: Metadata = { title: 'Recruiter Interest' };
export const dynamic = 'force-dynamic';

export default function InterestPage() {
  return (
    <div>
      <PageHeader
        eyebrow="The flywheel"
        title="Who's interested in you"
        description="When a recruiter sources you, moves you through their pipeline, or reaches out, it shows up here — the same explainable score they see, from your side. Two-sided by design."
      />
      <InterestClient />
    </div>
  );
}
