/**
 * Interview Kit agent — lifecycle stage 4 (Interview).
 * Turns a (job, candidate) pairing + its match gaps into a tailored interview plan:
 * focus areas, questions (with what-to-listen-for), and a weighted scorecard.
 *
 * Agentic & transparent: emits an AgentStep[] trace (analyze → questions → scorecard).
 * Graceful degradation: AI via completeJSON when keyed; deterministic heuristic otherwise.
 */
import 'server-only';
import { z } from 'zod';
import { completeJSON } from '@/lib/ai/client';
import { scoreMatch } from '@/lib/matching/scorer';
import { getRepo } from '@/lib/db';
import { InterviewKit } from '@/lib/domain/types';
import type { JobSpec, CandidateProfile, AgentStep, InterviewQuestion, ScorecardCriterion } from '@/lib/domain/types';

const AiKit = z.object({
  focusAreas: z.array(z.string()),
  questions: z.array(z.object({
    area: z.string(),
    type: z.enum(['technical', 'behavioral', 'system-design', 'culture']),
    question: z.string(),
    whatToListenFor: z.string().default(''),
  })),
  scorecard: z.array(z.object({
    criterion: z.string(),
    weight: z.number().int().min(1).max(5),
    rationale: z.string().default(''),
  })),
});

function titleCase(s: string): string {
  return s.replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

/** Deterministic kit built from must-have skills (technical), gaps (probe), and seniority (behavioral). */
function heuristicKit(job: JobSpec, candidate: CandidateProfile): { focusAreas: string[]; questions: InterviewQuestion[]; scorecard: ScorecardCriterion[] } {
  const match = scoreMatch(job, candidate);
  // Keep only gaps that read like a concrete missing skill (drop sentinels like "no significant gaps…").
  const gaps = match.gaps
    .filter((g) => !/no (significant )?gaps?/i.test(g) && g.length < 40)
    .slice(0, 3);
  const coreSkills = job.mustHaveSkills.slice(0, 4);
  const focusAreas = [...new Set([...coreSkills, ...gaps.map((g) => g.replace(/^Missing:?\s*/i, ''))])].slice(0, 5);

  const questions: InterviewQuestion[] = [];
  for (const skill of coreSkills) {
    questions.push({
      area: skill,
      type: 'technical',
      question: `Walk me through a non-trivial problem you solved with ${skill}. What trade-offs did you weigh?`,
      whatToListenFor: `Depth of hands-on ${skill} experience, sound reasoning about trade-offs, and ownership.`,
    });
  }
  for (const gap of gaps) {
    const area = gap.replace(/^Missing:?\s*/i, '');
    questions.push({
      area,
      type: 'technical',
      question: `Your profile shows limited ${area}. How would you ramp up, and where have you picked up a new technology fast before?`,
      whatToListenFor: `Honest self-assessment, learning strategy, transferable fundamentals.`,
    });
  }
  questions.push({
    area: 'System design',
    type: 'system-design',
    question: `Design a system for ${job.title.replace(/^(Senior|Staff|Lead|Principal|Junior)\s+/i, '').toLowerCase()} at scale. Start from requirements and call out the bottlenecks.`,
    whatToListenFor: 'Requirements-first thinking, scalability awareness, clear communication.',
  });
  questions.push({
    area: 'Collaboration',
    type: 'behavioral',
    question: 'Tell me about a time you disagreed with a teammate on a technical decision. How was it resolved?',
    whatToListenFor: 'Influence without authority, data-driven argument, respect for others.',
  });
  if (['senior', 'staff', 'principal', 'lead'].includes(job.seniority)) {
    questions.push({
      area: 'Leadership',
      type: 'behavioral',
      question: 'Describe a project you led end-to-end. What was your biggest mistake and what did you change after?',
      whatToListenFor: 'Ownership, reflection, mentoring, raising the bar for others.',
    });
  }

  const scorecard: ScorecardCriterion[] = [
    { criterion: `Core ${coreSkills[0] ?? 'technical'} proficiency`, weight: 5, rationale: 'Primary must-have for the role.' },
    { criterion: 'Problem-solving & trade-off reasoning', weight: 5, rationale: 'Predicts on-the-job effectiveness.' },
    { criterion: 'System / architecture thinking', weight: 4, rationale: `Scaled with ${job.seniority} expectations.` },
    { criterion: 'Communication & collaboration', weight: 4, rationale: 'Cross-functional fit.' },
    { criterion: 'Growth & learning mindset', weight: 3, rationale: 'Covers identified gaps.' },
  ];
  return { focusAreas: focusAreas.map(titleCase), questions, scorecard };
}

export async function runInterviewKit(
  requisitionId: string,
  candidateId: string,
): Promise<{ steps: AgentStep[]; kit: InterviewKit }> {
  const repo = getRepo();
  const req = repo.getRequisition(requisitionId);
  if (!req) throw new Error(`Requisition not found: ${requisitionId}`);
  const candidate = repo.internalCandidatePool().find((c) => c.id === candidateId)
    ?? repo.listPipeline(requisitionId).find((p) => p.candidate.id === candidateId)?.candidate;
  if (!candidate) throw new Error(`Candidate not found: ${candidateId}`);

  const job = req.spec;
  const match = scoreMatch(job, candidate);
  const steps: AgentStep[] = [];

  steps.push({
    step: 1,
    tool: 'analyze_fit',
    summary: `Analyzed ${candidate.name} vs ${job.title} (${match.overall}/100).`,
    detail: `strengths: ${match.strengths.slice(0, 2).join('; ') || '—'} | gaps: ${match.gaps.slice(0, 2).join('; ') || '—'}`,
  });

  const base = heuristicKit(job, candidate);
  let mode: InterviewKit['mode'] = 'heuristic';
  let body = base;

  const ai = await completeJSON(
    AiKit,
    'You are an expert technical interviewer. Produce a tailored, fair, role-specific interview kit. Probe the candidate gaps without being unfair. Return strict JSON with focusAreas (string[]), questions ({area,type in [technical,behavioral,system-design,culture],question,whatToListenFor}[]), scorecard ({criterion,weight 1-5,rationale}[]).',
    `JOB: ${job.title} (${job.seniority}). Must-have: ${job.mustHaveSkills.join(', ')}. Nice-to-have: ${job.niceToHaveSkills.join(', ')}.\nCANDIDATE: ${candidate.name} — ${candidate.headline}. Skills: ${candidate.skills.join(', ')}. ${candidate.yearsExperience} yrs, ${candidate.seniority}.\nMATCH: ${match.overall}/100. Strengths: ${match.strengths.join('; ')}. Gaps: ${match.gaps.join('; ')}.\nGenerate 5-7 questions covering core skills, the gaps, and one system-design + one behavioral.`,
    1800,
  );

  if (ai) {
    body = {
      focusAreas: ai.focusAreas,
      questions: ai.questions.map((q) => ({ ...q, whatToListenFor: q.whatToListenFor ?? '' })),
      scorecard: ai.scorecard.map((c) => ({ ...c, rationale: c.rationale ?? '' })),
    };
    mode = 'ai';
    steps.push({ step: 2, tool: 'generate_questions', summary: `Drafted ${ai.questions.length} tailored questions (AI).`, detail: `focus: ${ai.focusAreas.slice(0, 4).join(', ')}` });
  } else {
    steps.push({ step: 2, tool: 'generate_questions', summary: `Drafted ${base.questions.length} tailored questions (heuristic).`, detail: `focus: ${base.focusAreas.slice(0, 4).join(', ')}` });
  }
  steps.push({ step: 3, tool: 'build_scorecard', summary: `Built a ${body.scorecard.length}-criterion weighted scorecard.`, detail: body.scorecard.map((c) => `${c.criterion} (${c.weight})`).slice(0, 3).join(' · ') });

  const kit = InterviewKit.parse({
    candidateName: candidate.name,
    jobTitle: job.title,
    focusAreas: body.focusAreas,
    questions: body.questions,
    scorecard: body.scorecard,
    mode,
  });

  repo.audit({ actor: 'recruiter-demo', action: 'interview_kit.generated', target: `${requisitionId}:${candidateId}` });
  return { steps, kit };
}
