/**
 * /api/pipeline — recruiter CRM over the 7-stage lifecycle.
 * GET ?requisitionId → list. POST {action:'upsert'|'move', ...} → mutate (audited).
 */
import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { PipelineCard, PipelineStage } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { ok, validate, apiError, newId, nowIso } from '../common/api';

const UpsertSchema = z.object({
  action: z.literal('upsert'),
  card: PipelineCard.partial({ id: true, updatedAt: true }).extend({ requisitionId: z.string() }),
});
const MoveSchema = z.object({ action: z.literal('move'), id: z.string(), stage: PipelineStage });
const BodySchema = z.discriminatedUnion('action', [UpsertSchema, MoveSchema]);

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly repo: RepoService) {}

  @Get()
  list(@Query('requisitionId') requisitionId?: string) {
    return ok(this.repo.get().listPipeline(requisitionId));
  }

  @Post()
  mutate(@Body() body: unknown) {
    const data = validate(BodySchema, body);
    const repo = this.repo.get();

    if (data.action === 'move') {
      const moved = repo.movePipelineCard(data.id, data.stage);
      if (!moved) apiError(`Pipeline card ${data.id} not found`, HttpStatus.NOT_FOUND);
      repo.audit({ actor: 'recruiter-demo', action: `pipeline.move.${data.stage}`, target: moved.id });
      return ok(moved);
    }

    const card = PipelineCard.parse({
      ...data.card,
      id: data.card.id ?? newId('card'),
      updatedAt: nowIso(),
    });
    const saved = repo.upsertPipelineCard(card);
    repo.audit({ actor: 'recruiter-demo', action: 'pipeline.upsert', target: saved.id });
    return ok(saved);
  }
}
