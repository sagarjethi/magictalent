/**
 * Career Copilot — a LangGraph.js ReAct agent over read-only seeker tools.
 *
 * Graph: StateGraph(MessagesAnnotation), nodes "agent"/"tools".
 *   START → agent → (shouldContinue) → tools → agent → ... → END
 *
 * Tools (read-only, all heuristic-capable):
 *   - rank_jobs     → rankJobs over getRepo().listJobs() (the shared brain, seeker direction)
 *   - ats_score     → scoreAts on the seeker's resume
 *   - tailor_resume → tailorResumeSummary for the seeker's top-matched job
 *
 * LLM-driven when keyed; deterministic policy (rank jobs + ATS + summarize) when not.
 * Either way returns an AgentStep[] trace and a helpful textual answer citing real data.
 */
import 'server-only';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentStep, RankedJob, SeekerProfile, AtsReport } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { getChatModel } from './model';
import { rankJobs } from '@/lib/matching/scorer';
import { scoreAts } from '@/lib/matching/ats';
import { tailorResumeSummary } from '@/lib/matching/tailor';

interface CopilotContext {
  seeker: SeekerProfile;
  question: string;
  rankedJobs: RankedJob[];
  ats: AtsReport | null;
  tailored: string | null;
  steps: AgentStep[];
}

function buildTools(ctx: CopilotContext) {
  const record = (toolName: string, summary: string, detail = '') => {
    ctx.steps.push({ step: ctx.steps.length + 1, tool: toolName, summary, detail });
  };

  const rankJobsTool = tool(
    async () => {
      const jobs = getRepo().listJobs();
      ctx.rankedJobs = rankJobs(ctx.seeker.profile, jobs).slice(0, 5);
      const top = ctx.rankedJobs[0];
      record('rank_jobs', `Ranked ${jobs.length} open jobs for ${ctx.seeker.name}.`, top ? `best fit: ${top.job.spec.title} @ ${top.job.company} (${top.match.overall}/100)` : 'no jobs available');
      return JSON.stringify(ctx.rankedJobs.map((r) => ({ title: r.job.spec.title, company: r.job.company, overall: r.match.overall, gaps: r.match.gaps })));
    },
    { name: 'rank_jobs', description: 'Rank all open jobs against the seeker\'s profile and return the top matches with scores and gaps.', schema: z.object({}) },
  );

  const atsScoreTool = tool(
    async () => {
      ctx.ats = await scoreAts(ctx.seeker.rawResume || ctx.seeker.profile.summary);
      record('ats_score', `ATS score ${ctx.ats.score}/100 (${ctx.ats.issues.length} issues).`, ctx.ats.issues.slice(0, 3).map((i) => i.message).join(' | '));
      return JSON.stringify({ score: ctx.ats.score, issues: ctx.ats.issues, strengths: ctx.ats.strengths });
    },
    { name: 'ats_score', description: 'Score the seeker\'s resume for ATS-readiness and return issues and strengths.', schema: z.object({}) },
  );

  const tailorResumeTool = tool(
    async () => {
      const jobs = getRepo().listJobs();
      const ranked = ctx.rankedJobs.length ? ctx.rankedJobs : rankJobs(ctx.seeker.profile, jobs).slice(0, 1);
      const target = ranked[0];
      if (!target) {
        record('tailor_resume', 'No job available to tailor toward.', '');
        return JSON.stringify({ tailored: '' });
      }
      ctx.tailored = await tailorResumeSummary(ctx.seeker.profile, target.job.spec);
      record('tailor_resume', `Drafted a tailored summary for ${target.job.spec.title} @ ${target.job.company}.`, ctx.tailored.slice(0, 120));
      return JSON.stringify({ tailored: ctx.tailored, forJob: target.job.spec.title });
    },
    { name: 'tailor_resume', description: 'Draft a tailored professional summary aligning the seeker to their best-matched job.', schema: z.object({}) },
  );

  return [rankJobsTool, atsScoreTool, tailorResumeTool];
}

export async function runCareerCopilot(seekerId: string, question: string): Promise<{ steps: AgentStep[]; answer: string }> {
  const seeker = getRepo().getSeeker(seekerId);
  if (!seeker) {
    return { steps: [{ step: 1, tool: 'error', summary: `Seeker ${seekerId} not found.`, detail: '' }], answer: `I couldn't find a profile for ${seekerId}. Please create a seeker profile first.` };
  }

  const ctx: CopilotContext = { seeker, question, rankedJobs: [], ats: null, tailored: null, steps: [] };
  const tools = buildTools(ctx);
  const model = getChatModel();

  let answer = '';
  try {
    if (model) {
      answer = await runLlmGraph(model, tools, ctx);
    } else {
      answer = await runDeterministicGraph(tools, ctx);
    }
  } catch {
    answer = synthesizeAnswer(ctx);
  }

  if (!answer.trim()) answer = synthesizeAnswer(ctx);
  return { steps: ctx.steps, answer };
}

/* ── LLM-driven ReAct graph ── */
async function runLlmGraph(
  model: NonNullable<ReturnType<typeof getChatModel>>,
  tools: ReturnType<typeof buildTools>,
  ctx: CopilotContext,
): Promise<string> {
  const boundModel = model.bindTools(tools);
  const toolNode = new ToolNode(tools);

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await boundModel.invoke(state.messages);
    return { messages: [response] };
  };

  const shouldContinue = (state: typeof MessagesAnnotation.State): 'tools' | typeof END => {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    return last.tool_calls && last.tool_calls.length > 0 ? 'tools' : END;
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue, ['tools', END])
    .addEdge('tools', 'agent')
    .compile();

  const system = new SystemMessage(
    'You are Career Copilot, a helpful, honest career assistant for a job seeker. ' +
      'Use your tools (rank_jobs, ats_score, tailor_resume) to gather REAL data before answering. ' +
      'Cite specific job titles, companies, scores and gaps. Be concise and actionable.',
  );
  const result = await graph.invoke({ messages: [system, new HumanMessage(ctx.question)] }, { recursionLimit: 12 });

  const last = result.messages[result.messages.length - 1];
  const text = typeof last?.content === 'string' ? last.content : '';
  return text || synthesizeAnswer(ctx);
}

/* ── Deterministic policy graph (no key): same tools + a templated synthesis ── */
async function runDeterministicGraph(tools: ReturnType<typeof buildTools>, ctx: CopilotContext): Promise<string> {
  const policyNode = async (state: typeof MessagesAnnotation.State) => {
    // Always gather job ranking; add ATS / tailoring based on the question intent.
    const q = ctx.question.toLowerCase();
    await tools[0].invoke({}); // rank_jobs (always relevant)
    await tools[1].invoke({}); // ats_score (always useful context)
    if (/tailor|cover|summary|apply|rewrite|fit/.test(q)) await tools[2].invoke({}); // tailor_resume
    return { messages: [new AIMessage(synthesizeAnswer(ctx))] };
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode('policy', policyNode)
    .addEdge(START, 'policy')
    .addEdge('policy', END)
    .compile();

  const result = await graph.invoke({ messages: [new HumanMessage(ctx.question)] });
  const last = result.messages[result.messages.length - 1];
  return typeof last?.content === 'string' ? last.content : synthesizeAnswer(ctx);
}

/** Build a helpful textual answer from whatever the tools gathered (deterministic). */
function synthesizeAnswer(ctx: CopilotContext): string {
  const parts: string[] = [];
  parts.push(`Here's what I found for you, ${ctx.seeker.name}:`);

  if (ctx.rankedJobs.length) {
    const top = ctx.rankedJobs.slice(0, 3).map((r) => `• ${r.job.spec.title} @ ${r.job.company} — ${r.match.overall}/100`).join('\n');
    parts.push(`\nYour best-matched roles:\n${top}`);
    const topGaps = ctx.rankedJobs[0]?.match.gaps ?? [];
    if (topGaps.length) parts.push(`\nTo improve your top match, address: ${topGaps.slice(0, 2).join('; ')}.`);
  } else {
    parts.push('\nThere are no open jobs to rank right now.');
  }

  if (ctx.ats) {
    parts.push(`\nYour resume's ATS score is ${ctx.ats.score}/100.`);
    const high = ctx.ats.issues.filter((i) => i.severity === 'high').slice(0, 2);
    if (high.length) parts.push(`Top fixes: ${high.map((i) => i.fix).join(' ')}`);
  }

  if (ctx.tailored) parts.push(`\nSuggested tailored summary:\n"${ctx.tailored}"`);

  return parts.join('\n');
}
