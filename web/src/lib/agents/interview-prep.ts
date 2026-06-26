/**
 * Interview Prep agent — seeker-side counterpart of the recruiter Interview Kit.
 * Given a seeker + a target job, produces likely interview questions (with prep tips),
 * talking points (the seeker's strengths to lead with), and gaps to address.
 *
 * Agentic & transparent: emits an AgentStep[] trace (analyze → questions → coach).
 * Graceful degradation: AI via completeJSON when keyed; deterministic heuristic otherwise.
 */
import 'server-only';
import { z } from 'zod';
import { completeJSON } from '@/lib/ai/client';
import { scoreMatch } from '@/lib/matching/scorer';
import { getRepo } from '@/lib/db';
import { InterviewPrep } from '@/lib/domain/types';
import type { JobSpec, CandidateProfile, AgentStep, PrepQuestion } from '@/lib/domain/types';

const AiPrep = z.object({
  questions: z.array(z.object({
    type: z.enum(['technical', 'behavioral', 'system-design', 'culture']),
    question: z.string(),
    tip: z.string().default(''),
  })),
  talkingPoints: z.array(z.string()),
  gapsToAddress: z.array(z.string()),
});

function heuristicPrep(job: JobSpec, candidate: CandidateProfile): {
  questions: PrepQuestion[]; talkingPoints: string[]; gapsToAddress: string[];
} {
  const match = scoreMatch(job, candidate);
  const overlap = job.mustHaveSkills.filter((s) =>
    candidate.skills.some((c) => c.toLowerCase() === s.toLowerCase()),
  );
  const gaps = job.mustHaveSkills.filter((s) =>
    !candidate.skills.some((c) => c.toLowerCase() === s.toLowerCase()),
  );

  const questions: PrepQuestion[] = [];
  for (const skill of overlap.slice(0, 3)) {
    questions.push({
      type: 'technical',
      question: `Can you walk through a project where you used ${skill} and the toughest problem you hit?`,
      tip: `Prepare one concrete ${skill} story with a measurable outcome (STAR format).`,
    });
  }
  for (const gap of gaps.slice(0, 2)) {
    questions.push({
      type: 'technical',
      question: `How comfortable are you with ${gap}? Have you used it?`,
      tip: `Be honest: name the closest experience you have and how you'd ramp up on ${gap} quickly.`,
    });
  }
  questions.push({
    type: 'system-design',
    question: `Design a system relevant to a ${job.title}. How would you approach scale and reliability?`,
    tip: 'Start from requirements, state assumptions, and talk trade-offs out loud.',
  });
  questions.push({
    type: 'behavioral',
    question: 'Tell me about a time you handled conflicting priorities or a hard deadline.',
    tip: 'Use STAR; emphasize impact and what you learned.',
  });

  const talkingPoints = [
    overlap.length ? `Lead with your strength in ${overlap.slice(0, 3).join(', ')} — directly matches the must-haves.` : 'Lead with your most relevant project for this role.',
    `${candidate.yearsExperience} years of experience at the ${candidate.seniority} level.`,
    ...match.strengths.slice(0, 2),
  ].filter(Boolean);

  const gapsToAddress = gaps.length
    ? gaps.map((g) => `Be ready to address limited ${g} experience — show how you'd close the gap.`)
    : ['No major skill gaps detected — focus on depth and impact stories.'];

  return { questions, talkingPoints, gapsToAddress };
}

export async function runInterviewPrep(
  seekerId: string,
  jobId: string,
): Promise<{ steps: AgentStep[]; prep: InterviewPrep }> {
  const repo = getRepo();
  const seeker = repo.getSeeker(seekerId);
  if (!seeker) throw new Error(`Seeker not found: ${seekerId}`);
  const job = repo.getJob(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const candidate = seeker.profile;
  const match = scoreMatch(job.spec, candidate);
  const trace: AgentStep[] = [];

  trace.push({
    step: 1,
    tool: 'analyze_fit',
    summary: `Analyzed your fit for ${job.spec.title} @ ${job.company} (${match.overall}/100).`,
    detail: `strengths: ${match.strengths.slice(0, 2).join('; ') || '—'} | gaps: ${match.gaps.slice(0, 2).join('; ') || '—'}`,
  });

  const base = heuristicPrep(job.spec, candidate);
  let body = base;
  let mode: InterviewPrep['mode'] = 'heuristic';

  const ai = await completeJSON(
    AiPrep,
    'You are a supportive interview coach for a job seeker. Produce a prep pack: likely questions (with a concrete prep tip each), talking points (strengths to lead with), and gaps to address honestly. Return strict JSON: questions[]{type in [technical,behavioral,system-design,culture],question,tip}, talkingPoints[], gapsToAddress[].',
    `TARGET JOB: ${job.spec.title} (${job.spec.seniority}) at ${job.company}. Must-have: ${job.spec.mustHaveSkills.join(', ')}. Nice-to-have: ${job.spec.niceToHaveSkills.join(', ')}.\nSEEKER: ${candidate.name} — ${candidate.headline}. Skills: ${candidate.skills.join(', ')}. ${candidate.yearsExperience} yrs, ${candidate.seniority}.\nMATCH: ${match.overall}/100. Strengths: ${match.strengths.join('; ')}. Gaps: ${match.gaps.join('; ')}.\nGenerate 5-6 likely questions plus talking points and gaps to address.`,
    1800,
  );

  if (ai && ai.questions.length > 0) {
    body = {
      questions: ai.questions.map((q) => ({ ...q, tip: q.tip ?? '' })),
      talkingPoints: ai.talkingPoints,
      gapsToAddress: ai.gapsToAddress,
    };
    mode = 'ai';
    trace.push({ step: 2, tool: 'predict_questions', summary: `Predicted ${ai.questions.length} likely questions (AI).`, detail: '' });
  } else {
    trace.push({ step: 2, tool: 'predict_questions', summary: `Predicted ${base.questions.length} likely questions (heuristic).`, detail: '' });
  }
  trace.push({
    step: 3,
    tool: 'coach',
    summary: `Prepared ${body.talkingPoints.length} talking points and ${body.gapsToAddress.length} gaps to address.`,
    detail: body.talkingPoints[0] ?? '',
  });

  const prep = InterviewPrep.parse({
    jobTitle: job.spec.title,
    company: job.company,
    questions: body.questions,
    talkingPoints: body.talkingPoints,
    gapsToAddress: body.gapsToAddress,
    mode,
  });

  repo.audit({ actor: seekerId, action: 'interview_prep.generated', target: jobId });
  return { steps: trace, prep };
}
