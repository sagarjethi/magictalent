/**
 * /api/requisitions — list (GET) + create from a raw JD (POST, parses JD into a JobSpec).
 */
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { Requisition } from '../lib/domain/types';
import { RepoService } from '../core/repo.service';
import { MatchingService } from '../core/matching.service';
import { ok, validate, newId, nowIso } from '../common/api';

const CreateSchema = z.object({
  rawDescription: z.string().min(1, 'Job description is required'),
  company: z.string().min(1, 'Company is required'),
  ownerId: z.string().optional(),
  status: z.enum(['draft', 'open', 'closed']).optional(),
});

@Controller('requisitions')
export class RequisitionsController {
  constructor(
    private readonly repo: RepoService,
    private readonly matching: MatchingService,
  ) {}

  @Get()
  list() {
    return ok(this.repo.get().listRequisitions());
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown) {
    const { rawDescription, company, ownerId, status } = validate(CreateSchema, body);
    const spec = await this.matching.parseJobDescription(rawDescription, company);

    const requisition = Requisition.parse({
      id: newId('req'),
      spec,
      company,
      rawDescription,
      status: status ?? 'open',
      createdAt: nowIso(),
      ownerId: ownerId ?? 'recruiter-demo',
    });

    const created = this.repo.get().createRequisition(requisition);
    this.repo.get().audit({ actor: created.ownerId, action: 'requisition.create', target: created.id });
    return ok(created);
  }
}
