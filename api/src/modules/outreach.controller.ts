/**
 * /api/outreach — recruiter first-touch messages (draft + store only; no send in MVP).
 * GET ?requisitionId → list. POST {candidateId, requisitionId} → draft + store.
 */
import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { OutreachMessage, CandidateProfile } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { MatchingService } from '../core/matching.service';
import { aiEnabled } from '../lib/ai/client';
import { ok, validate, apiError, newId, nowIso } from '../common/api';

const BodySchema = z.object({
  candidateId: z.string().min(1),
  requisitionId: z.string().min(1),
  candidate: CandidateProfile.optional(),
});

@Controller('outreach')
export class OutreachController {
  constructor(
    private readonly repo: RepoService,
    private readonly matching: MatchingService,
  ) {}

  @Get()
  list(@Query('requisitionId') requisitionId?: string) {
    return ok(this.repo.get().listOutreach(requisitionId));
  }

  @Post()
  async create(@Body() body: unknown) {
    const { candidateId, requisitionId, candidate: inlineCandidate } = validate(BodySchema, body);
    const repo = this.repo.get();

    const requisition = repo.getRequisition(requisitionId);
    if (!requisition) apiError(`Requisition ${requisitionId} not found`, HttpStatus.NOT_FOUND);

    const candidate =
      inlineCandidate ??
      repo.getSeeker(candidateId)?.profile ??
      repo.internalCandidatePool().find((c) => c.id === candidateId);
    if (!candidate) apiError(`Candidate ${candidateId} not found`, HttpStatus.NOT_FOUND);

    const { subject, body: msgBody } = await this.matching.draftOutreach(candidate, requisition.spec);
    const message = OutreachMessage.parse({
      id: newId('msg'),
      candidateId,
      requisitionId,
      subject,
      body: msgBody,
      status: 'draft',
      mode: aiEnabled() ? 'ai' : 'heuristic',
      createdAt: nowIso(),
    });
    const created = repo.createOutreach(message);
    repo.audit({ actor: requisition.ownerId, action: 'outreach.draft', target: created.id });
    return ok(created);
  }
}
