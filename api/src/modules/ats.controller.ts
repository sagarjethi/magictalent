/**
 * POST /api/ats — score a resume's ATS-readiness (AI + heuristic fallback).
 */
import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { MatchingService } from '../core/matching.service';
import { ok, validate } from '../common/api';

const BodySchema = z.object({ rawResume: z.string().min(1, 'rawResume is required') });

@Controller('ats')
export class AtsController {
  constructor(private readonly matching: MatchingService) {}

  @Post()
  async score(@Body() body: unknown) {
    const { rawResume } = validate(BodySchema, body);
    return ok(await this.matching.scoreAts(rawResume));
  }
}
