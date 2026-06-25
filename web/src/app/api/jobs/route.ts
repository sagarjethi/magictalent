/**
 * /api/jobs — list seeker-facing job listings.
 */
import { getRepo } from '@/lib/db';
import { ok, fail } from '../_helpers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return ok(getRepo().listJobs());
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
