import type { Metadata } from 'next';
import { RoomClient } from './RoomClient';

export const metadata: Metadata = { title: 'Interview Room' };
export const dynamic = 'force-dynamic';

export default function RoomPage({ params }: { params: { id: string } }) {
  return <RoomClient interviewId={params.id} />;
}
