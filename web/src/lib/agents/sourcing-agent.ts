/**
 * Sourcing Agent — a LangGraph.js ReAct agent over recruiter tools.
 *
 * Graph: StateGraph(MessagesAnnotation) with an "agent" (reason) node and a "tools" node.
 *   START → agent → (shouldContinue) → tools → agent → ... → END
 *
 * Tools (LangChain `tool()` wrappers over our domain functions, all heuristic-capable):
 *   - parse_jd         → parse the requisition's JD into a JobSpec
 *   - search_sources   → fan out via source-factory + normalize + dedupe
 *   - score_candidates → rankCandidates (the shared brain) → shortlist
 *
 * When getChatModel() is non-null the model drives via true tool-calling. When it is null we
 * run a DETERMINISTIC policy that invokes the same tools in canonical order (parse → search →
 * score). EITHER WAY the agent emits an identical-shape AgentStep[] trace and returns the
 * ranked shortlist.
 */
import 'server-only';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { JobSpec, CandidateProfile, RankedCandidate, AgentStep, Requisition } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { getChatModel } from './model';
import { parseJobDescription } from '@/lib/matching/jd-parser';
import { rankCandidates } from '@/lib/matching/scorer';
import { searchAllSources } from '@/lib/sources/source-factory';

interface SourcingContext {
  requisition: Requisition;
  spec: JobSpec | null;
  candidates: CandidateProfile[];
  shortlist: RankedCandidate[];
  steps: AgentStep[];
}

const MAX_SHORTLIST = 10;

/** Build the three tools bound to a mutable run context (so we capture typed results). */
function buildTools(ctx: SourcingContext) {
  const record = (toolName: string, summary: string, detail = '') => {
    ctx.steps.push({ step: ctx.steps.length + 1, tool: toolName, summary, detail });
  };

  const parseJd = tool(
    async () => {
      ctx.spec = await parseJobDescription(ctx.requisition.rawDescription || ctx.requisition.spec.summary, ctx.requisition.company);
      record('parse_jd', `Parsed JD for "${ctx.spec.title}" (${ctx.spec.seniority}).`, `must-haves: ${ctx.spec.mustHaveSkills.join(', ') || 'n/a'}`);
      return JSON.stringify({ title: ctx.spec.title, seniority: ctx.spec.seniority, mustHaveSkills: ctx.spec.mustHaveSkills, minYearsExperience: ctx.spec.minYearsExperience });
    },
    {
      name: 'parse_jd',
      description: 'Parse the requisition\'s job description into a structured JobSpec. Call this first.',
      schema: z.object({}),
    },
  );

  const searchSources = tool(
    async () => {
      const spec = ctx.spec ?? ctx.requisition.spec;
      ctx.spec = spec;
      ctx.candidates = await searchAllSources(spec, { limit: 25 });
      record('search_sources', `Sourced ${ctx.candidates.length} unique candidates across enabled sources.`, candidateBreakdown(ctx.candidates));
      return JSON.stringify({ count: ctx.candidates.length, sources: [...new Set(ctx.candidates.map((c) => c.source))] });
    },
    {
      name: 'search_sources',
      description: 'Fan out to all enabled candidate sources (internal pool + GitHub), normalize and dedupe. Call after parse_jd.',
      schema: z.object({}),
    },
  );

  const scoreCandidates = tool(
    async () => {
      const spec = ctx.spec ?? ctx.requisition.spec;
      ctx.shortlist = rankCandidates(spec, ctx.candidates).slice(0, MAX_SHORTLIST);
      const top = ctx.shortlist[0];
      record('score_candidates', `Ranked ${ctx.candidates.length} candidates; shortlisted top ${ctx.shortlist.length}.`, top ? `top: ${top.candidate.name} (${top.match.overall}/100)` : 'no candidates');
      return JSON.stringify({ shortlist: ctx.shortlist.map((r) => ({ name: r.candidate.name, overall: r.match.overall, source: r.candidate.source })) });
    },
    {
      name: 'score_candidates',
      description: 'Score every sourced candidate against the JobSpec with the shared matching engine and return the ranked shortlist. Call last.',
      schema: z.object({}),
    },
  );

  return [parseJd, searchSources, scoreCandidates];
}

function candidateBreakdown(candidates: CandidateProfile[]): string {
  const counts = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([s, n]) => `${s}: ${n}`).join(', ');
}

/** Run the agent for a requisition. Works identically (graph + trace) with or without a key. */
export async function runSourcingAgent(requisitionId: string): Promise<{ steps: AgentStep[]; shortlist: RankedCandidate[] }> {
  const requisition = getRepo().getRequisition(requisitionId);
  if (!requisition) {
    return {
      steps: [{ step: 1, tool: 'error', summary: `Requisition ${requisitionId} not found.`, detail: '' }],
      shortlist: [],
    };
  }

  const ctx: SourcingContext = { requisition, spec: null, candidates: [], shortlist: [], steps: [] };
  const tools = buildTools(ctx);
  const model = getChatModel();

  try {
    if (model) {
      await runLlmGraph(model, tools, requisition, ctx);
    } else {
      await runDeterministicGraph(tools, ctx);
    }
  } catch {
    // Last-resort safety net: ensure we still produce a shortlist even if the graph errors.
    if (ctx.shortlist.length === 0) {
      const spec = ctx.spec ?? requisition.spec;
      if (ctx.candidates.length === 0) ctx.candidates = await searchAllSources(spec, { limit: 25 }).catch(() => []);
      ctx.shortlist = rankCandidates(spec, ctx.candidates).slice(0, MAX_SHORTLIST);
    }
  }

  return { steps: ctx.steps, shortlist: ctx.shortlist };
}

/* ── LLM-driven path: a real ReAct StateGraph with bound tools ── */
async function runLlmGraph(
  model: NonNullable<ReturnType<typeof getChatModel>>,
  tools: ReturnType<typeof buildTools>,
  requisition: Requisition,
  ctx: SourcingContext,
): Promise<void> {
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

  const system = new HumanMessage(
    `You are a sourcing agent. For requisition "${requisition.spec.title}" at ${requisition.company}, ` +
      'use your tools IN ORDER: parse_jd, then search_sources, then score_candidates. ' +
      'Call each exactly once, then summarize the shortlist. Do not skip tools.',
  );

  await graph.invoke({ messages: [system] }, { recursionLimit: 12 });

  // Safety: if the model under-drove the tools, finish deterministically so output is complete.
  await ensureComplete(tools, ctx);
}

/* ── Deterministic path: same tools, canonical order, same trace shape (a graph node policy) ── */
async function runDeterministicGraph(tools: ReturnType<typeof buildTools>, ctx: SourcingContext): Promise<void> {
  // A single-node StateGraph whose node IS the canonical policy — still a real compiled graph.
  const policyNode = async (state: typeof MessagesAnnotation.State) => {
    for (const t of tools) {
      // eslint-disable-next-line no-await-in-loop
      await t.invoke({});
    }
    return { messages: [new AIMessage(`Sourcing complete: ${ctx.shortlist.length} candidates shortlisted.`)] };
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode('policy', policyNode)
    .addEdge(START, 'policy')
    .addEdge('policy', END)
    .compile();

  await graph.invoke({ messages: [new HumanMessage('Run the deterministic sourcing policy.')] });
}

/** Ensure every stage ran at least once (used after the LLM path). */
async function ensureComplete(tools: ReturnType<typeof buildTools>, ctx: SourcingContext): Promise<void> {
  const ran = new Set(ctx.steps.map((s) => s.tool));
  const order = ['parse_jd', 'search_sources', 'score_candidates'];
  for (let i = 0; i < order.length; i++) {
    if (!ran.has(order[i])) {
      // eslint-disable-next-line no-await-in-loop
      await tools[i].invoke({});
    }
  }
}
