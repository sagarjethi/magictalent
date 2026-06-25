/**
 * GET /api/jobs — list seeker-facing job listings.
 */
import { Controller, Get } from '@nestjs/common';
import { RepoService } from '../core/repo.service';
import { ok } from '../common/api';

@Controller('jobs')
export class JobsController {
  constructor(private readonly repo: RepoService) {}

  @Get()
  list() {
    return ok(this.repo.get().listJobs());
  }
}
