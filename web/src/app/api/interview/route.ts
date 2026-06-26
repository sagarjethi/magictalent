/**
 * /api/interview — browser video interviews (lifecycle stage 4: Interview).
 * GET ?requisitionId → list scheduled/completed interviews (optionally filtered).
 * POST { requisitionId, candidateId, scheduledAt, durationMins?, candidateName?, candidateContact? }
 *   → schedule a new interview. Auth-gated.
 */
import { z } from 'zod';
import { InterviewSession } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { ok, fail, readJson, newId, nowIso, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const requisitionId = new URL(req.url).searchParams.get('requisitionId') ?? undefined;
    return ok(getRepo().listInterviews(requisitionId));
  } catch (e) {
    return handleError(e);
  }
}

const CreateSchema = z.object({
  requisitionId: z.string(),
  candidateId: z.string(),
  candidateName: z.string().optional(),
  candidateContact: z.string().optional(),
  scheduledAt: z.string(),
  durationMins: z.number().int().min(5).max(240).optional(),
});

export async function POST(req: Request) {
  try {
    const user = requireUser(req);
    const parsed = CreateSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const repo = getRepo();

    const req_ = repo.getRequisition(parsed.data.requisitionId);
    if (!req_) return fail(`Requisition ${parsed.data.requisitionId} not found`, 404);

    const card = repo.listPipeline(parsed.data.requisitionId).find((c) => c.candidate.id === parsed.data.candidateId);
    const candidateName = parsed.data.candidateName ?? card?.candidate.name ?? 'Candidate';

    const now = nowIso();
    const session = InterviewSession.parse({
      id: newId('iv'),
      requisitionId: parsed.data.requisitionId,
      candidateId: parsed.data.candidateId,
      candidateName,
      candidateContact: parsed.data.candidateContact ?? '',
      jobTitle: req_.spec.title,
      company: req_.company,
      recruiterId: user.id,
      scheduledAt: parsed.data.scheduledAt,
      durationMins: parsed.data.durationMins ?? 30,
      status: 'scheduled',
      invites: [],
      recording: {},
      transcript: [],
      createdAt: now,
      updatedAt: now,
    });

    const saved = repo.createInterview(session);
    repo.audit({ actor: user.id, action: 'interview.scheduled', target: saved.id });
    return ok(saved, 201);
  } catch (e) {
    return handleError(e);
  }
}
