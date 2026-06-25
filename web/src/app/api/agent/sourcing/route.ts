/**
 * /api/agent/sourcing — run the LangGraph Sourcing Agent for a requisition.
 * Returns the AgentStep[] reasoning trace + the ranked shortlist for human review.
 */
import { z } from 'zod';
import { getRepo } from '@/lib/db';
import { runSourcingAgent } from '@/lib/agents/sourcing-agent';
import { agentModelEnabled } from '@/lib/agents/model';
import { ok, fail, readJson } from '../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({ requisitionId: z.string().min(1, 'requisitionId is required') });

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const { steps, shortlist } = await runSourcingAgent(parsed.data.requisitionId);
    getRepo().audit({ actor: 'recruiter-demo', action: 'agent.sourcing.run', target: parsed.data.requisitionId });
    return ok({ mode: agentModelEnabled() ? 'ai' : 'heuristic', steps, shortlist });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
