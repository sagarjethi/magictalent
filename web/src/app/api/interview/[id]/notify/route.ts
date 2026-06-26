/**
 * /api/interview/[id]/notify — send the candidate their interview invite.
 * POST { channel: 'email'|'sms'|'in-app' } → composes + delivers (or simulates) the invite,
 * appends it to the session, and returns the updated session. Auth-gated (recruiter action).
 */
import { z } from 'zod';
import { InviteChannel } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { sendInvite } from '@/lib/notify/invites';
import { ok, fail, readJson, requireUser, handleError } from '../../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({ channel: InviteChannel.default('in-app') });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const repo = getRepo();
    const session = repo.getInterview(params.id);
    if (!session) return fail(`Interview ${params.id} not found`, 404);

    const invite = await sendInvite(session, parsed.data.channel);
    const updated = repo.updateInterview(params.id, { invites: [...session.invites, invite] });
    repo.audit({ actor: user.id, action: `interview.invite.${invite.channel}.${invite.status}`, target: params.id });
    return ok({ invite, session: updated });
  } catch (e) {
    return handleError(e);
  }
}
