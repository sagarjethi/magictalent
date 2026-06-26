/**
 * /api/seeker/interest — the two-way flywheel from the seeker's side.
 * Returns recruiter interest in this seeker: which requisitions saved them to a pipeline
 * (with stage), and any outreach they've received. Auth-gated.
 */
import { getRepo } from '@/lib/db';
import { ok, fail, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const seekerId = new URL(req.url).searchParams.get('seekerId');
    if (!seekerId) return fail('seekerId is required', 422);

    const repo = getRepo();
    const { cards, outreach } = repo.interestForSeeker(seekerId);

    const interests = cards.map((c) => {
      const r = repo.getRequisition(c.requisitionId);
      return {
        requisitionId: c.requisitionId,
        jobTitle: r?.spec.title ?? 'A role',
        company: r?.company ?? 'A company',
        stage: c.stage,
        matchOverall: c.match.overall,
        updatedAt: c.updatedAt,
      };
    });
    const messages = outreach.map((m) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      status: m.status,
      createdAt: m.createdAt,
    }));

    return ok({ interests, outreach: messages });
  } catch (e) {
    return handleError(e);
  }
}
