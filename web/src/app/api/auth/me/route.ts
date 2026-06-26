/**
 * GET /api/auth/me — reads `Authorization: Bearer <token>` → { user } or 401.
 */
import { currentUser } from '@/lib/auth/service';
import { ok, fail } from '../../_helpers';

export const runtime = 'nodejs';

function bearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function GET(req: Request) {
  try {
    const token = bearer(req);
    const user = token ? currentUser(token) : null;
    if (!user) return fail('Not authenticated', 401);
    return ok({ user });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
