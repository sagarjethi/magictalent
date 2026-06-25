import type { Metadata } from 'next';
import { getRepo } from '@/lib/db';
import { CURRENT_SEEKER_ID } from '@/lib/api-client';
import { PageHeader } from '../../_components/PageHeader';
import { ProfileClient } from './ProfileClient';

export const metadata: Metadata = { title: 'Profile' };
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const seeker = getRepo().getSeeker(CURRENT_SEEKER_ID) ?? null;
  return (
    <div>
      <PageHeader
        eyebrow="Your profile"
        title="One profile, two audiences"
        description="The same structured profile powers your job matches and lets recruiters discover you in the internal talent pool — only with your participation."
      />
      <ProfileClient initial={seeker} />
    </div>
  );
}
