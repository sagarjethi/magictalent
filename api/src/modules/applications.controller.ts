/**
 * /api/applications — the seeker's application tracker.
 * GET ?seekerId → list. POST → create (optional auto cover letter). PATCH → update status.
 */
import { Body, Controller, Get, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { Application, ApplicationStatus } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { MatchingService } from '../core/matching.service';
import { ok, validate, apiError, newId, nowIso } from '../common/api';

const CreateSchema = z.object({
  seekerId: z.string().min(1),
  jobId: z.string().min(1),
  coverLetter: z.string().optional(),
  autoCoverLetter: z.boolean().optional(),
});
const PatchSchema = z.object({ id: z.string().min(1), status: ApplicationStatus });

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly repo: RepoService,
    private readonly matching: MatchingService,
  ) {}

  @Get()
  list(@Query('seekerId') seekerId?: string) {
    return ok(this.repo.get().listApplications(seekerId));
  }

  @Post()
  async create(@Body() body: unknown) {
    const { seekerId, jobId, coverLetter, autoCoverLetter } = validate(CreateSchema, body);
    const repo = this.repo.get();

    const job = repo.getJob(jobId);
    if (!job) apiError(`Job ${jobId} not found`, HttpStatus.NOT_FOUND);
    const seeker = repo.getSeeker(seekerId);
    if (!seeker) apiError(`Seeker ${seekerId} not found`, HttpStatus.NOT_FOUND);

    let letter = coverLetter ?? '';
    if (!letter && autoCoverLetter) {
      letter = await this.matching.draftCoverLetter(seeker.profile, job.spec);
    }

    const application = Application.parse({
      id: newId('app'),
      seekerId,
      jobId,
      jobTitle: job.spec.title,
      company: job.company,
      status: 'Applied',
      coverLetter: letter,
      appliedAt: nowIso(),
    });
    const created = repo.createApplication(application);
    repo.audit({ actor: seekerId, action: 'application.create', target: created.id });
    return ok(created);
  }

  @Patch()
  patch(@Body() body: unknown) {
    const { id, status } = validate(PatchSchema, body);
    const repo = this.repo.get();
    const updated = repo.setApplicationStatus(id, status);
    if (!updated) apiError(`Application ${id} not found`, HttpStatus.NOT_FOUND);
    repo.audit({ actor: updated.seekerId, action: `application.status.${status}`, target: updated.id });
    return ok(updated);
  }
}
