/**
 * POST /api/source — quick (non-agent) sourcing: fan out to adapters + rankCandidates.
 */
import { Body, Controller, Post, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { RepoService } from '../core/repo.service';
import { SourcingService } from '../core/sourcing.service';
import { MatchingService } from '../core/matching.service';
import { ok, validate, apiError } from '../common/api';

const BodySchema = z.object({
  requisitionId: z.string().min(1, 'requisitionId is required'),
  limit: z.number().int().min(1).max(50).optional(),
});

@Controller('source')
export class SourceController {
  constructor(
    private readonly repo: RepoService,
    private readonly sourcing: SourcingService,
    private readonly matching: MatchingService,
  ) {}

  @Post()
  async source(@Body() body: unknown) {
    const { requisitionId, limit } = validate(BodySchema, body);
    const requisition = this.repo.get().getRequisition(requisitionId);
    if (!requisition) apiError(`Requisition ${requisitionId} not found`, HttpStatus.NOT_FOUND);

    const candidates = await this.sourcing.searchAllSources(requisition.spec, { limit: limit ?? 25 });
    const ranked = this.matching.rankCandidates(requisition.spec, candidates);
    return ok({ count: ranked.length, ranked });
  }
}
