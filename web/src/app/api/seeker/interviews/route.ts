/**
 * /api/seeker/interviews — the candidate's own video interviews (upcoming + past).
 * GET ?seekerId → interviews where this platform seeker is the candidate. Auth-gated.
 */
import { getRepo } from '@/lib/db';
import { ok, fail, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const seekerId = new URL(req.url).searchParams.get('seekerId');
    if (!seekerId) return fail('seekerId is required', 422);
    return ok(getRepo().interviewsForSeeker(seekerId));
  } catch (e) {
    return handleError(e);
  }
}
