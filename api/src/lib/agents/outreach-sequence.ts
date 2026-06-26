/**
 * Outreach Sequencer agent — lifecycle stage 6 (Hire).
 * Turns a (job, candidate) pairing into a multi-touch outreach cadence:
 * an initial message + timed follow-ups, each with a channel, subject, body, and goal.
 *
 * Agentic & transparent: emits an AgentStep[] trace (analyze → draft initial → plan follow-ups).
 * Graceful degradation: AI via completeJSON when keyed; deterministic templated heuristic otherwise.
 */
import { z } from 'zod';
import { completeJSON } from '../ai/client';
import { scoreMatch } from '../matching/scorer';
import { draftOutreach } from '../matching/tailor';
import { getRepo } from '../db';
import { OutreachSequence } from '../domain/types';
import type { JobSpec, CandidateProfile, AgentStep, SequenceStep } from '../domain/types';

const AiSequence = z.object({
  steps: z.array(z.object({
    dayOffset: z.number().int().min(0).max(60),
    channel: z.enum(['email', 'inmail', 'sms']),
    subject: z.string(),
    body: z.string(),
    goal: z.string().default(''),
  })),
});

/** Deterministic 3-touch cadence: initial (day 0) + nudge (+3) + final value-add (+7). */
async function heuristicSequence(job: JobSpec, candidate: CandidateProfile): Promise<SequenceStep[]> {
  const first = await draftOutreach(candidate, job);
  const firstName = candidate.name.split(' ')[0] || candidate.name;
  const topSkill = job.mustHaveSkills[0] ?? candidate.skills[0] ?? 'your background';
  return [
    {
      dayOffset: 0,
      channel: 'email',
      subject: first.subject,
      body: first.body,
      goal: 'Open the conversation with a personalized, relevant first touch.',
    },
    {
      dayOffset: 3,
      channel: 'email',
      subject: `Re: ${first.subject}`,
      body: `Hi ${firstName},\n\nJust floating this back to the top of your inbox — I genuinely think your ${topSkill} experience is a strong fit for the ${job.title} role. Happy to share the team and scope on a quick 15-min call if you're open.\n\nBest,\nRiya`,
      goal: 'Gentle reminder; lower the barrier to a short call.',
    },
    {
      dayOffset: 7,
      channel: 'email',
      subject: `One more note on the ${job.title} role`,
      body: `Hi ${firstName},\n\nLast note from me — I don't want to crowd your inbox. If the timing isn't right, no problem at all; I'd love to stay in touch for the future. If you're even mildly curious, I can send over the role details and comp range so you can decide async.\n\nEither way, wishing you the best.\n\nRiya`,
      goal: 'Respectful final touch; leave the door open + offer async detail.',
    },
  ];
}

export async function runOutreachSequence(
  requisitionId: string,
  candidateId: string,
): Promise<{ steps: AgentStep[]; sequence: OutreachSequence }> {
  const repo = getRepo();
  const req = repo.getRequisition(requisitionId);
  if (!req) throw new Error(`Requisition not found: ${requisitionId}`);
  const candidate = repo.internalCandidatePool().find((c) => c.id === candidateId)
    ?? repo.listPipeline(requisitionId).find((p) => p.candidate.id === candidateId)?.candidate;
  if (!candidate) throw new Error(`Candidate not found: ${candidateId}`);

  const job = req.spec;
  const match = scoreMatch(job, candidate);
  const trace: AgentStep[] = [];

  trace.push({
    step: 1,
    tool: 'analyze_fit',
    summary: `Analyzed ${candidate.name} for ${job.title} (${match.overall}/100).`,
    detail: `hook: ${match.strengths[0] ?? 'relevant skills'}`,
  });

  const base = await heuristicSequence(job, candidate);
  let steps = base;
  let mode: OutreachSequence['mode'] = 'heuristic';

  const ai = await completeJSON(
    AiSequence,
    'You are an expert technical recruiter writing a respectful, high-conversion outreach cadence. Personalize to the candidate, never spammy, always with an opt-out tone. Return strict JSON: steps[] of { dayOffset (int days, first=0), channel in [email,inmail,sms], subject, body, goal }. 3 touches: initial, a +3 day nudge, a +7 day final.',
    `JOB: ${job.title} (${job.seniority}) at ${req.company}. Must-have: ${job.mustHaveSkills.join(', ')}.\nCANDIDATE: ${candidate.name} — ${candidate.headline}. Skills: ${candidate.skills.join(', ')}.\nMATCH: ${match.overall}/100. Strengths: ${match.strengths.join('; ')}.\nWrite a 3-touch outreach sequence.`,
    1800,
  );

  if (ai && ai.steps.length > 0) {
    steps = ai.steps.map((s) => ({ ...s, goal: s.goal ?? '' }));
    mode = 'ai';
    trace.push({ step: 2, tool: 'draft_initial', summary: `Drafted the first touch (AI).`, detail: steps[0]?.subject ?? '' });
  } else {
    trace.push({ step: 2, tool: 'draft_initial', summary: `Drafted the first touch (heuristic).`, detail: steps[0]?.subject ?? '' });
  }
  trace.push({
    step: 3,
    tool: 'plan_followups',
    summary: `Planned ${steps.length} touches over ${steps[steps.length - 1]?.dayOffset ?? 0} days.`,
    detail: steps.map((s) => `+${s.dayOffset}d ${s.channel}`).join(' · '),
  });

  const sequence = OutreachSequence.parse({
    candidateName: candidate.name,
    jobTitle: job.title,
    steps,
    mode,
  });

  repo.audit({ actor: 'recruiter-demo', action: 'outreach_sequence.generated', target: `${requisitionId}:${candidateId}` });
  return { steps: trace, sequence };
}
