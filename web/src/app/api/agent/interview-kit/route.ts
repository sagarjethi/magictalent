/**
 * /api/agent/interview-kit — generate a tailored interview kit for a (requisition, candidate) pair.
 * Returns the AgentStep[] trace + the InterviewKit (focus areas, questions, weighted scorecard).
 */
import { z } from 'zod';
import { runInterviewKit } from '@/lib/agents/interview-kit';
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

    const { steps, kit } = await runInterviewKit(parsed.data.requisitionId, parsed.data.candidateId);
    return ok({ steps, kit });
  } catch (e) {
    return handleError(e);
  }
}
