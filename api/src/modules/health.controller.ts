/**
 * GET /api/health — liveness + capability mode (ai vs heuristic).
 */
import { Controller, Get } from '@nestjs/common';
import { ok } from '../common/api';
import { aiEnabled } from '../lib/ai/client';
import { agentModelEnabled } from '../lib/agents/model';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return ok({
      status: 'ok',
      service: 'jobmagic-api',
      time: new Date().toISOString(),
      ai: aiEnabled() ? 'enabled' : 'heuristic',
      agents: agentModelEnabled() ? 'enabled' : 'heuristic',
    });
  }
}
