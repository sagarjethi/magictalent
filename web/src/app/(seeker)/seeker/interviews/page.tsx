import type { Metadata } from 'next';
import { PageHeader } from '../../_components/PageHeader';
import { SeekerInterviewsClient } from './SeekerInterviewsClient';

export const metadata: Metadata = { title: 'My Interviews' };
export const dynamic = 'force-dynamic';

export default function SeekerInterviewsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Interview"
        title="My video interviews"
        description="When a recruiter schedules a video interview with you, it appears here. Join from your browser — camera and mic, no install. After the call, your debrief summary shows up too."
      />
      <SeekerInterviewsClient />
    </div>
  );
}
