/**
 * /api/interview/[id]/transcript — append speech-to-text segments captured in the browser.
 * POST { segments: TranscriptSegment[], replace?: boolean } → stores them on the session.
 * The room page streams final utterances here from the Web Speech API. Auth-gated.
 */
import { z } from 'zod';
import { TranscriptSegment } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { ok, fail, readJson, requireUser, handleError } from '../../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  segments: z.array(TranscriptSegment),
  replace: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const repo = getRepo();
    const session = repo.getInterview(params.id);
    if (!session) return fail(`Interview ${params.id} not found`, 404);

    const transcript = parsed.data.replace
      ? parsed.data.segments
      : [...session.transcript, ...parsed.data.segments];
    const updated = repo.updateInterview(params.id, { transcript });
    return ok({ count: updated?.transcript.length ?? 0 });
  } catch (e) {
    return handleError(e);
  }
}
