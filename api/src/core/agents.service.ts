/**
 * AgentsService — DI wrapper over the LangGraph agents (graceful degradation preserved).
 */
import { Injectable } from '@nestjs/common';
import type { AgentStep, RankedCandidate } from '../lib/domain/types';
import { runSourcingAgent } from '../lib/agents/sourcing-agent';
import { runCareerCopilot } from '../lib/agents/career-copilot';
import { agentModelEnabled } from '../lib/agents/model';

@Injectable()
export class AgentsService {
  modelEnabled(): boolean {
    return agentModelEnabled();
  }

  runSourcing(requisitionId: string): Promise<{ steps: AgentStep[]; shortlist: RankedCandidate[] }> {
    return runSourcingAgent(requisitionId);
  }

  runCopilot(seekerId: string, question: string): Promise<{ steps: AgentStep[]; answer: string }> {
    return runCareerCopilot(seekerId, question);
  }
}
