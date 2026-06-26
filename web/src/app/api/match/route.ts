/**
 * /api/match — score one (job, candidate) pair with the shared brain.
 * Accepts either a jobId (resolved via repo) or an inline jobSpec, plus a candidateId.
 * The numeric breakdown is always deterministic; set ?enrich=1 / { enrich:true } to add AI narrative.
 */
import { z } from 'zod';
import { JobSpec } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { scoreMatch, enrichMatchWithAI } from '@/lib/matching/scorer';
import { ok, fail, readJson, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

const BodySchema = z
  .object({
    jobId: z.string().optional(),
    jobSpec: JobSpec.optional(),
    candidateId: z.string().min(1, 'candidateId is required'),
    enrich: z.boolean().optional(),
  })
  .refine((b) => b.jobId || b.jobSpec, { message: 'Provide jobId or jobSpec' });

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const { jobId, jobSpec, candidateId, enrich } = parsed.data;

    const repo = getRepo();
    const spec = jobSpec ?? repo.getJob(jobId!)?.spec ?? repo.getRequisition(jobId!)?.spec;
    if (!spec) return fail(`Job/requisition ${jobId} not found`, 404);

    // Candidate can be an internal seeker or any pooled candidate.
    const candidate =
      repo.getSeeker(candidateId)?.profile ??
      repo.internalCandidatePool().find((c) => c.id === candidateId);
    if (!candidate) return fail(`Candidate ${candidateId} not found`, 404);

    const base = scoreMatch(spec, candidate);
    const result = enrich ? await enrichMatchWithAI(spec, candidate, base) : base;
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
