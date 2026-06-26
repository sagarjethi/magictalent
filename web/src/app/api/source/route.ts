/**
 * /api/source — quick (non-agent) sourcing path.
 * POST { requisitionId } → fan out to enabled source adapters + rankCandidates (shared brain).
 * For the multi-step agentic version with a reasoning trace, see /api/agent/sourcing.
 */
import { z } from 'zod';
import { getRepo } from '@/lib/db';
import { searchAllSources } from '@/lib/sources/source-factory';
import { rankCandidates } from '@/lib/matching/scorer';
import { ok, fail, readJson, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  requisitionId: z.string().min(1, 'requisitionId is required'),
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const requisition = getRepo().getRequisition(parsed.data.requisitionId);
    if (!requisition) return fail(`Requisition ${parsed.data.requisitionId} not found`, 404);

    const candidates = await searchAllSources(requisition.spec, { limit: parsed.data.limit ?? 25 });
    const ranked = rankCandidates(requisition.spec, candidates);
    return ok({ count: ranked.length, ranked });
  } catch (e) {
    return handleError(e);
  }
}
