/**
 * /api/outreach — recruiter first-touch messages.
 * GET ?requisitionId → list. POST { candidateId, requisitionId } → draft (AI + heuristic) + store.
 * No email is sent in the MVP — drafts are stored and audited only.
 */
import { z } from 'zod';
import { OutreachMessage, CandidateProfile } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { draftOutreach } from '@/lib/matching/tailor';
import { aiEnabled } from '@/lib/ai/client';
import { ok, fail, readJson, newId, nowIso, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const requisitionId = new URL(req.url).searchParams.get('requisitionId') ?? undefined;
    return ok(getRepo().listOutreach(requisitionId));
  } catch (e) {
    return handleError(e);
  }
}

const BodySchema = z.object({
  candidateId: z.string().min(1),
  requisitionId: z.string().min(1),
  /** Optional inline candidate (e.g. a freshly-sourced GitHub profile not yet persisted). */
  candidate: CandidateProfile.optional(),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const repo = getRepo();

    const requisition = repo.getRequisition(parsed.data.requisitionId);
    if (!requisition) return fail(`Requisition ${parsed.data.requisitionId} not found`, 404);

    const candidate =
      parsed.data.candidate ??
      repo.getSeeker(parsed.data.candidateId)?.profile ??
      repo.internalCandidatePool().find((c) => c.id === parsed.data.candidateId);
    if (!candidate) return fail(`Candidate ${parsed.data.candidateId} not found`, 404);

    const { subject, body } = await draftOutreach(candidate, requisition.spec);
    const message = OutreachMessage.parse({
      id: newId('msg'),
      candidateId: parsed.data.candidateId,
      requisitionId: parsed.data.requisitionId,
      subject,
      body,
      status: 'draft',
      mode: aiEnabled() ? 'ai' : 'heuristic',
      createdAt: nowIso(),
    });
    const created = repo.createOutreach(message);
    repo.audit({ actor: requisition.ownerId, action: 'outreach.draft', target: created.id });
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}
