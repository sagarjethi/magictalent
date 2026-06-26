/**
 * /api/interview/[id]/status — transition an interview's lifecycle state.
 * POST { status } where status ∈ scheduled|in-progress|recorded|completed|cancelled. Auth-gated.
 * Used by the room page ("Start" → in-progress) and recruiter controls (cancel).
 */
import { z } from 'zod';
import { InterviewStatus } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { ok, fail, readJson, requireUser, handleError } from '../../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({ status: InterviewStatus });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const repo = getRepo();
    if (!repo.getInterview(params.id)) return fail(`Interview ${params.id} not found`, 404);

    const updated = repo.updateInterview(params.id, { status: parsed.data.status });
    repo.audit({ actor: user.id, action: `interview.status.${parsed.data.status}`, target: params.id });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
