/**
 * /api/agent/* — the LangGraph agents (real graph + AgentStep trace in BOTH key/no-key modes).
 * POST /agent/sourcing {requisitionId}. POST /agent/copilot {seekerId, question}.
 */
import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { RepoService } from '../core/repo.service';
import { AgentsService } from '../core/agents.service';
import { ok, validate } from '../common/api';

const SourcingSchema = z.object({ requisitionId: z.string().min(1, 'requisitionId is required') });
const CopilotSchema = z.object({
  seekerId: z.string().min(1, 'seekerId is required'),
  question: z.string().min(1, 'question is required'),
});

@Controller('agent')
export class AgentController {
  constructor(
    private readonly repo: RepoService,
    private readonly agents: AgentsService,
  ) {}

  @Post('sourcing')
  async sourcing(@Body() body: unknown) {
    const { requisitionId } = validate(SourcingSchema, body);
    const { steps, shortlist } = await this.agents.runSourcing(requisitionId);
    this.repo.get().audit({ actor: 'recruiter-demo', action: 'agent.sourcing.run', target: requisitionId });
    return ok({ mode: this.agents.modelEnabled() ? 'ai' : 'heuristic', steps, shortlist });
  }

  @Post('copilot')
  async copilot(@Body() body: unknown) {
    const { seekerId, question } = validate(CopilotSchema, body);
    const { steps, answer } = await this.agents.runCopilot(seekerId, question);
    return ok({ mode: this.agents.modelEnabled() ? 'ai' : 'heuristic', steps, answer });
  }
}
