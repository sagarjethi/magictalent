/**
 * Interview Report agent — turns a recorded interview transcript into a structured debrief.
 *
 * Pipeline stage 4→5 (Interview → Select): given a completed InterviewSession (transcript +
 * the job it was for + the candidate), produce competency scores, an overall score, a
 * hire recommendation, strengths, concerns, and follow-ups.
 *
 * Agentic & transparent: emits an AgentStep[] trace (load → analyze transcript → score).
 * Graceful degradation: AI via completeJSON (xAI/Anthropic) when keyed; deterministic
 * transcript-coverage heuristic otherwise. Result carries mode: 'ai' | 'heuristic'.
 */
import { z } from 'zod';
import { completeJSON } from '../ai/client';
import { getRepo } from '../db';
import { InterviewReport } from '../domain/types';
import type {
  AgentStep, InterviewSession, JobSpec, CandidateProfile,
  CompetencyScore, InterviewRecommendation,
} from '../domain/types';

const AiReport = z.object({
  summary: z.string(),
  overallScore: z.number().min(0).max(100),
  recommendation: z.enum(['strong-hire', 'hire', 'lean-hire', 'lean-no-hire', 'no-hire']),
  competencies: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    evidence: z.string().default(''),
  })),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  followUps: z.array(z.string()),
});

function recommend(score: number): InterviewRecommendation {
  if (score >= 80) return 'strong-hire';
  if (score >= 68) return 'hire';
  if (score >= 55) return 'lean-hire';
  if (score >= 45) return 'lean-no-hire';
  return 'no-hire';
}

function transcriptText(session: InterviewSession): string {
  return session.transcript.map((t) => t.text).join(' ').trim();
}

/** Deterministic fallback: score each must-have skill by whether the transcript evidences it. */
function heuristicReport(session: InterviewSession, job: JobSpec, candidate: CandidateProfile): {
  summary: string; overallScore: number; recommendation: InterviewRecommendation;
  competencies: CompetencyScore[]; strengths: string[]; concerns: string[]; followUps: string[];
} {
  const text = transcriptText(session).toLowerCase();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const skills = job.mustHaveSkills.length ? job.mustHaveSkills : candidate.skills.slice(0, 4);

  const competencies: CompetencyScore[] = skills.slice(0, 6).map((skill) => {
    const mentioned = text.includes(skill.toLowerCase());
    return {
      name: skill,
      score: mentioned ? 78 : 48,
      evidence: mentioned
        ? `Candidate discussed ${skill} during the interview.`
        : `${skill} was not clearly evidenced in the transcript.`,
    };
  });

  // Communication competency proxied by how substantive the spoken transcript was.
  const commScore = wordCount === 0 ? 40 : wordCount < 120 ? 58 : wordCount < 400 ? 72 : 84;
  competencies.push({
    name: 'Communication',
    score: commScore,
    evidence: wordCount === 0
      ? 'No transcript captured — communication could not be assessed.'
      : `~${wordCount} words of spoken responses captured.`,
  });

  const overallScore = Math.round(
    competencies.reduce((sum, c) => sum + c.score, 0) / competencies.length,
  );
  const strengths = competencies.filter((c) => c.score >= 70).map((c) => `Demonstrated ${c.name}.`);
  const concerns = competencies.filter((c) => c.score < 55).map((c) => `Limited evidence of ${c.name}.`);

  const summary = wordCount === 0
    ? `Interview for ${candidate.name} (${job.title}) has no captured transcript yet. Scores reflect baseline expectations only — record the session to generate an evidence-based report.`
    : `${candidate.name} interviewed for ${job.title}. Based on the captured transcript, overall performance scores ${overallScore}/100 (${recommend(overallScore)}). Strongest in ${strengths.length ? strengths.length + ' area(s)' : 'no standout areas'}; ${concerns.length} area(s) need follow-up.`;

  return {
    summary,
    overallScore,
    recommendation: recommend(overallScore),
    competencies,
    strengths: strengths.length ? strengths : ['No clearly demonstrated strengths in this transcript.'],
    concerns: concerns.length ? concerns : ['No major concerns flagged from the transcript.'],
    followUps: concerns.slice(0, 3).map((c) => `Probe further: ${c.replace(/^Limited evidence of /, '')}`),
  };
}

export async function runInterviewReport(
  interviewId: string,
): Promise<{ steps: AgentStep[]; report: InterviewReport }> {
  const repo = getRepo();
  const session = repo.getInterview(interviewId);
  if (!session) throw new Error(`Interview not found: ${interviewId}`);
  const requisition = repo.getRequisition(session.requisitionId);
  if (!requisition) throw new Error(`Requisition not found: ${session.requisitionId}`);

  // Candidate profile from the matching pipeline card if present, else a minimal view.
  const card = repo.listPipeline(session.requisitionId).find((c) => c.candidate.id === session.candidateId);
  const candidate: CandidateProfile = card?.candidate ?? {
    id: session.candidateId, name: session.candidateName, headline: '', skills: [],
    seniority: 'mid', yearsExperience: 0, openToRemote: true, experience: [], summary: '',
    source: 'internal-pool', sourceId: session.candidateId, sourcedAt: session.createdAt,
  };

  const job = requisition.spec;
  const trace: AgentStep[] = [];
  const text = transcriptText(session);
  const wordCount = text ? text.split(/\s+/).length : 0;

  trace.push({
    step: 1,
    tool: 'load_interview',
    summary: `Loaded interview for ${session.candidateName} — ${job.title} @ ${session.company}.`,
    detail: `${session.transcript.length} transcript segment(s), ${wordCount} words; recording ${session.recording.chunkCount} chunk(s).`,
  });

  const base = heuristicReport(session, job, candidate);
  let body = base;
  let mode: InterviewReport['mode'] = 'heuristic';

  const ai = await completeJSON(
    AiReport,
    'You are a senior hiring panel lead writing a structured interview debrief from a transcript. Be fair and evidence-based; cite the transcript. Return strict JSON: summary, overallScore (0-100), recommendation in [strong-hire,hire,lean-hire,lean-no-hire,no-hire], competencies[]{name,score 0-100,evidence}, strengths[], concerns[], followUps[].',
    `ROLE: ${job.title} (${job.seniority}) at ${session.company}. Must-have skills: ${job.mustHaveSkills.join(', ') || '—'}. Nice-to-have: ${job.niceToHaveSkills.join(', ') || '—'}.\nCANDIDATE: ${candidate.name} — ${candidate.headline || 'n/a'}. Skills on file: ${candidate.skills.join(', ') || '—'}.\nINTERVIEW TRANSCRIPT (${wordCount} words):\n${text || '[no transcript captured]'}\n\nScore each must-have as a competency, plus Communication. Ground every score in the transcript.`,
    2000,
  );

  if (ai && ai.competencies.length > 0) {
    body = {
      summary: ai.summary,
      overallScore: ai.overallScore,
      recommendation: ai.recommendation,
      competencies: ai.competencies.map((c) => ({ ...c, evidence: c.evidence ?? '' })),
      strengths: ai.strengths,
      concerns: ai.concerns,
      followUps: ai.followUps,
    };
    mode = 'ai';
    trace.push({ step: 2, tool: 'analyze_transcript', summary: `Analyzed transcript and scored ${ai.competencies.length} competencies (AI).`, detail: '' });
  } else {
    trace.push({ step: 2, tool: 'analyze_transcript', summary: `Scored ${base.competencies.length} competencies (heuristic transcript coverage).`, detail: '' });
  }

  trace.push({
    step: 3,
    tool: 'recommend',
    summary: `Overall ${body.overallScore}/100 → ${body.recommendation}.`,
    detail: body.summary,
  });

  const report = InterviewReport.parse({
    summary: body.summary,
    overallScore: body.overallScore,
    recommendation: body.recommendation,
    competencies: body.competencies,
    strengths: body.strengths,
    concerns: body.concerns,
    followUps: body.followUps,
    mode,
    generatedAt: new Date().toISOString(),
  });

  repo.updateInterview(interviewId, { report, status: 'completed' });
  repo.audit({ actor: session.recruiterId, action: 'interview.report.generated', target: interviewId });
  return { steps: trace, report };
}
