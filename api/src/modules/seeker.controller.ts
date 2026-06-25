/**
 * /api/seeker/profile — the seeker's own profile.
 * GET ?seekerId → one (or list all). POST {rawResume,name,email} → parse resume → upsert.
 */
import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { SeekerProfile, CandidateProfile } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { MatchingService } from '../core/matching.service';
import { ok, validate, apiError, newId, nowIso } from '../common/api';

const BodySchema = z.object({
  rawResume: z.string().min(1, 'rawResume is required'),
  name: z.string().min(1, 'name is required'),
  email: z.string().email().or(z.literal('')).optional(),
  id: z.string().optional(),
  location: z.string().optional(),
});

@Controller('seeker/profile')
export class SeekerController {
  constructor(
    private readonly repo: RepoService,
    private readonly matching: MatchingService,
  ) {}

  @Get()
  get(@Query('seekerId') seekerId?: string) {
    const repo = this.repo.get();
    if (!seekerId) return ok(repo.listSeekers());
    const seeker = repo.getSeeker(seekerId);
    if (!seeker) apiError(`Seeker ${seekerId} not found`, HttpStatus.NOT_FOUND);
    return ok(seeker);
  }

  @Post()
  async upsert(@Body() body: unknown) {
    const data = validate(BodySchema, body);
    const repo = this.repo.get();
    const id = data.id ?? newId('seeker');
    const r = await this.matching.parseResume(data.rawResume);

    const profile = CandidateProfile.parse({
      id,
      name: data.name,
      headline: r.headline,
      skills: r.skills,
      seniority: r.seniority,
      yearsExperience: r.yearsExperience,
      location: data.location,
      openToRemote: true,
      experience: r.experience,
      summary: r.summary,
      source: 'internal-pool',
      sourceId: id,
      sourceUrl: undefined,
      sourcedAt: nowIso(),
    });

    const seeker = SeekerProfile.parse({
      id,
      name: data.name,
      email: data.email ?? '',
      rawResume: data.rawResume,
      profile,
      createdAt: nowIso(),
    });

    const saved = repo.upsertSeeker(seeker);
    repo.audit({ actor: id, action: 'seeker.upsert', target: id });
    return ok(saved);
  }
}
