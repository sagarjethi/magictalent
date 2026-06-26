/**
 * /api/pipeline — recruiter CRM over the 7-stage lifecycle.
 * GET ?requisitionId → list cards (optionally filtered).
 * POST { action:'upsert', card } → create/update a card.
 * POST { action:'move', id, stage } → move a card to a new stage (audited).
 */
import { z } from 'zod';
import { PipelineCard, PipelineStage } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { ok, fail, readJson, newId, nowIso, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const requisitionId = new URL(req.url).searchParams.get('requisitionId') ?? undefined;
    return ok(getRepo().listPipeline(requisitionId));
  } catch (e) {
    return handleError(e);
  }
}

const UpsertSchema = z.object({
  action: z.literal('upsert'),
  card: PipelineCard.partial({ id: true, updatedAt: true }).extend({
    requisitionId: z.string(),
  }),
});

const MoveSchema = z.object({
  action: z.literal('move'),
  id: z.string(),
  stage: PipelineStage,
});

const BodySchema = z.discriminatedUnion('action', [UpsertSchema, MoveSchema]);

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const repo = getRepo();

    if (parsed.data.action === 'move') {
      const moved = repo.movePipelineCard(parsed.data.id, parsed.data.stage);
      if (!moved) return fail(`Pipeline card ${parsed.data.id} not found`, 404);
      repo.audit({ actor: 'recruiter-demo', action: `pipeline.move.${parsed.data.stage}`, target: moved.id });
      return ok(moved);
    }

    // upsert
    const card = PipelineCard.parse({
      ...parsed.data.card,
      id: parsed.data.card.id ?? newId('card'),
      updatedAt: nowIso(),
    });
    const saved = repo.upsertPipelineCard(card);
    repo.audit({ actor: 'recruiter-demo', action: 'pipeline.upsert', target: saved.id });
    return ok(saved, 201);
  } catch (e) {
    return handleError(e);
  }
}
