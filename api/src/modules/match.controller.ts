/**
 * POST /api/match — score one (job, candidate) pair with the shared brain.
 * Accepts jobId (resolved via repo) or inline jobSpec, plus candidateId. enrich adds AI narrative.
 */
import { Body, Controller, Post } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { JobSpec } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { MatchingService } from '../core/matching.service';
import { ok, validate, apiError } from '../common/api';

const BodySchema = z
  .object({
    jobId: z.string().optional(),
    jobSpec: JobSpec.optional(),
    candidateId: z.string().min(1, 'candidateId is required'),
    enrich: z.boolean().optional(),
  })
  .refine((b) => b.jobId || b.jobSpec, { message: 'Provide jobId or jobSpec' });

@Controller('match')
export class MatchController {
  constructor(
    private readonly repo: RepoService,
    private readonly matching: MatchingService,
  ) {}

  @Post()
  async match(@Body() body: unknown) {
    const { jobId, jobSpec, candidateId, enrich } = validate(BodySchema, body);
    const repo = this.repo.get();

    const spec = jobSpec ?? (jobId ? repo.getJob(jobId)?.spec ?? repo.getRequisition(jobId)?.spec : undefined);
    if (!spec) apiError(`Job/requisition ${jobId} not found`, HttpStatus.NOT_FOUND);

    const candidate =
      repo.getSeeker(candidateId)?.profile ??
      repo.internalCandidatePool().find((c) => c.id === candidateId);
    if (!candidate) apiError(`Candidate ${candidateId} not found`, HttpStatus.NOT_FOUND);

    const base = this.matching.scoreMatch(spec, candidate);
    const result = enrich ? await this.matching.enrichMatch(spec, candidate, base) : base;
    return ok(result);
  }
}
