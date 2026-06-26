/**
 * /api/seeker/interest — the two-way flywheel from the seeker's side.
 * GET ?seekerId → recruiter interest (pipeline stage per requisition) + outreach received.
 */
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { RepoService } from '../core/repo.service';
import { ok, apiError } from '../common/api';

@Controller('seeker/interest')
export class SeekerInterestController {
  constructor(private readonly repo: RepoService) {}

  @Get()
  get(@Query('seekerId') seekerId?: string) {
    if (!seekerId) apiError('seekerId is required', HttpStatus.UNPROCESSABLE_ENTITY);
    const repo = this.repo.get();
    const { cards, outreach } = repo.interestForSeeker(seekerId as string);

    const interests = cards.map((c) => {
      const r = repo.getRequisition(c.requisitionId);
      return {
        requisitionId: c.requisitionId,
        jobTitle: r?.spec.title ?? 'A role',
        company: r?.company ?? 'A company',
        stage: c.stage,
        matchOverall: c.match.overall,
        updatedAt: c.updatedAt,
      };
    });
    const messages = outreach.map((m) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      status: m.status,
      createdAt: m.createdAt,
    }));

    return ok({ interests, outreach: messages });
  }
}
