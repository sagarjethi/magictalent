/**
 * /api/seeker/interviews — the candidate's own video interviews (upcoming + past).
 * GET ?seekerId → interviews where this platform seeker is the candidate. Auth-gated.
 */
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { RepoService } from '../core/repo.service';
import { ok, apiError } from '../common/api';

@Controller('seeker/interviews')
export class SeekerInterviewsController {
  constructor(private readonly repo: RepoService) {}

  @Get()
  get(@Query('seekerId') seekerId?: string) {
    if (!seekerId) apiError('seekerId is required', HttpStatus.UNPROCESSABLE_ENTITY);
    return ok(this.repo.get().interviewsForSeeker(seekerId as string));
  }
}
