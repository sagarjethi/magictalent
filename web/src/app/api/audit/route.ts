/**
 * /api/audit — read the audit log (most recent first). ?limit caps the count.
 */
import { getRepo } from '@/lib/db';
import { ok, fail, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const raw = new URL(req.url).searchParams.get('limit');
    const limit = raw ? Math.max(1, Math.min(500, parseInt(raw, 10) || 100)) : undefined;
    return ok(getRepo().listAudit(limit));
  } catch (e) {
    return handleError(e);
  }
}
