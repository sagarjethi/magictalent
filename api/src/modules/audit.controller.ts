/**
 * GET /api/audit — read the audit log (most recent first). ?limit caps the count.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { RepoService } from '../core/repo.service';
import { ok } from '../common/api';

@Controller('audit')
export class AuditController {
  constructor(private readonly repo: RepoService) {}

  @Get()
  list(@Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Math.max(1, Math.min(500, parseInt(limitRaw, 10) || 100)) : undefined;
    return ok(this.repo.get().listAudit(limit));
  }
}
