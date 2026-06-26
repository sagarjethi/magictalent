/**
 * /api/interview/[id]/report — generate the AI interview debrief from the transcript.
 * POST → runs the interview-report agent (xAI/Anthropic with heuristic fallback), saves the
 * report on the session, marks it completed, and returns { steps, report }. Auth-gated.
 */
import { runInterviewReport } from '@/lib/agents/interview-report';
import { ok, requireUser, handleError } from '../../../_helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    requireUser(req);
    const result = await runInterviewReport(params.id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
