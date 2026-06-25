import type { BadgeTone } from '@/components/ui';
import type { ApplicationStatus } from '@/lib/domain/types';

/** The seeker-facing happy path of the lifecycle (Rejected/Withdrawn are terminal off-ramps). */
export const APPLICATION_FLOW: ApplicationStatus[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

export const APP_STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  Applied: 'slate',
  Screening: 'brand',
  Interview: 'brand',
  Offer: 'amber',
  Hired: 'green',
  Rejected: 'red',
  Withdrawn: 'slate',
};
