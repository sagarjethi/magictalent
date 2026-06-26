/**
 * /api/agent/copilot — run the LangGraph Career Copilot for a seeker.
 * Returns the AgentStep[] reasoning trace + a helpful textual answer citing real data.
 */
import { z } from 'zod';
import { runCareerCopilot } from '@/lib/agents/career-copilot';
import { agentModelEnabled } from '@/lib/agents/model';
import { ok, fail, readJson, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  seekerId: z.string().min(1, 'seekerId is required'),
  question: z.string().min(1, 'question is required'),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const { steps, answer } = await runCareerCopilot(parsed.data.seekerId, parsed.data.question);
    return ok({ mode: agentModelEnabled() ? 'ai' : 'heuristic', steps, answer });
  } catch (e) {
    return handleError(e);
  }
}
