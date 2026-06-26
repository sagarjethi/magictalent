/**
 * /api/agent/outreach-sequence — generate a multi-touch outreach cadence for a
 * (requisition, candidate) pair. Returns the AgentStep[] trace + the OutreachSequence.
 */
import { z } from 'zod';
import { runOutreachSequence } from '@/lib/agents/outreach-sequence';
import { ok, fail, readJson, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  requisitionId: z.string().min(1, 'requisitionId is required'),
  candidateId: z.string().min(1, 'candidateId is required'),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const { steps, sequence } = await runOutreachSequence(parsed.data.requisitionId, parsed.data.candidateId);
    return ok({ steps, sequence });
  } catch (e) {
    return handleError(e);
  }
}
