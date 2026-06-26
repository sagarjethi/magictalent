/**
 * /api/agent/interview-prep — generate a seeker-side interview prep pack for a target job.
 * Returns the AgentStep[] trace + the InterviewPrep (questions, talking points, gaps).
 */
import { z } from 'zod';
import { runInterviewPrep } from '@/lib/agents/interview-prep';
import { ok, fail, readJson, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  seekerId: z.string().min(1, 'seekerId is required'),
  jobId: z.string().min(1, 'jobId is required'),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const { steps, prep } = await runInterviewPrep(parsed.data.seekerId, parsed.data.jobId);
    return ok({ steps, prep });
  } catch (e) {
    return handleError(e);
  }
}
