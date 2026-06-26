/**
 * /api/interview/[id] — fetch a single interview session (auth-gated).
 * Used by the room page (recruiter + candidate) and the report view.
 */
import { getRepo } from '@/lib/db';
import { ok, fail, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    requireUser(req);
    const session = getRepo().getInterview(params.id);
    if (!session) return fail(`Interview ${params.id} not found`, 404);
    return ok(session);
  } catch (e) {
    return handleError(e);
  }
}
