/**
 * AgentsService — DI wrapper over the LangGraph agents (graceful degradation preserved).
 */
import { Injectable } from '@nestjs/common';
import type { AgentStep, RankedCandidate, InterviewKit, OutreachSequence, InterviewPrep, InterviewReport } from '../lib/domain/types';
import { runSourcingAgent } from '../lib/agents/sourcing-agent';
import { runCareerCopilot } from '../lib/agents/career-copilot';
import { runInterviewKit } from '../lib/agents/interview-kit';
import { runOutreachSequence } from '../lib/agents/outreach-sequence';
import { runInterviewPrep } from '../lib/agents/interview-prep';
import { runInterviewReport } from '../lib/agents/interview-report';
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

  runInterviewKit(requisitionId: string, candidateId: string): Promise<{ steps: AgentStep[]; kit: InterviewKit }> {
    return runInterviewKit(requisitionId, candidateId);
  }

  runOutreachSequence(requisitionId: string, candidateId: string): Promise<{ steps: AgentStep[]; sequence: OutreachSequence }> {
    return runOutreachSequence(requisitionId, candidateId);
  }

  runInterviewPrep(seekerId: string, jobId: string): Promise<{ steps: AgentStep[]; prep: InterviewPrep }> {
    return runInterviewPrep(seekerId, jobId);
  }

  runInterviewReport(interviewId: string): Promise<{ steps: AgentStep[]; report: InterviewReport }> {
    return runInterviewReport(interviewId);
  }
}
