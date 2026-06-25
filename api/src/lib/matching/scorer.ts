/**
 * The shared matching brain — pure, deterministic, explainable.
 *
 * `scoreMatch(job, candidate)` is the single source of truth used in BOTH directions:
 *   - recruiter view: `rankCandidates(job, candidates[])`
 *   - seeker view:    `rankJobs(candidate, jobs[])`
 *
 * The numeric breakdown is computed entirely in code (no AI), so seeker-view and
 * recruiter-view always agree on the same (JobSpec, CandidateProfile) pair. AI only
 * enriches reasoning/strengths/gaps via `enrichMatchWithAI`, never the numbers.
 */
import { z } from 'zod';
import type {
  JobSpec, CandidateProfile, MatchResult, MatchBreakdown, RankedCandidate, RankedJob, Job,
} from '../domain/types';
import { completeJSON } from '../ai/client';
import { normalize, containsTerm, SENIORITY_RANK } from './keywords';

/* Weights for the overall score — sum to 1. Tuned for engineering roles. */
const WEIGHTS = { skills: 0.45, experience: 0.2, keywords: 0.2, seniority: 0.15 } as const;

function round(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

/** Candidate's full searchable text blob (skills + headline + summary + experience). */
function candidateText(c: CandidateProfile): string {
  const exp = c.experience.map((e) => `${e.title} ${e.company} ${e.highlights.join(' ')}`).join(' ');
  return `${c.headline} ${c.summary} ${c.skills.join(' ')} ${exp}`;
}

/** Fraction (0..1) of `required` terms present in the candidate's normalized skill set. */
function skillCoverage(required: string[], candidateSkills: Set<string>, blob: string): number {
  if (required.length === 0) return 1;
  let hit = 0;
  for (const r of required) {
    const nr = normalize(r);
    if (candidateSkills.has(nr) || containsTerm(blob, nr)) hit++;
  }
  return hit / required.length;
}

/**
 * Score a single (job, candidate) pair. PURE & deterministic — given the same inputs it
 * always returns the same breakdown and overall. mode is always 'heuristic' here.
 */
export function scoreMatch(job: JobSpec, candidate: CandidateProfile): MatchResult {
  const skillSet = new Set(candidate.skills.map(normalize));
  const blob = candidateText(candidate);

  // --- skills: must-haves dominate, nice-to-haves are a bonus ---
  const mustCov = skillCoverage(job.mustHaveSkills, skillSet, blob);
  const niceCov = skillCoverage(job.niceToHaveSkills, skillSet, blob);
  const skills = job.mustHaveSkills.length === 0 && job.niceToHaveSkills.length === 0
    ? 70 // no stated skills → neutral-positive
    : round(mustCov * 85 + niceCov * 15);

  // --- keywords: coverage of the JD's keyword list across the candidate blob ---
  const keywords = job.keywords.length === 0
    ? skills // fall back to skills signal when no keywords specified
    : round(skillCoverage(job.keywords, skillSet, blob) * 100);

  // --- experience: candidate years vs required minimum (saturating, slight bonus over) ---
  let experience: number;
  if (job.minYearsExperience <= 0) {
    experience = 80;
  } else {
    const ratio = candidate.yearsExperience / job.minYearsExperience;
    experience = ratio >= 1 ? round(90 + Math.min(10, (ratio - 1) * 10)) : round(ratio * 90);
  }

  // --- seniority: closeness on the shared rank scale ---
  const dist = Math.abs(SENIORITY_RANK[candidate.seniority] - SENIORITY_RANK[job.seniority]);
  const seniority = round(100 - dist * 22);

  const breakdown: MatchBreakdown = { skills, experience, keywords, seniority };
  const overall = round(
    skills * WEIGHTS.skills +
    experience * WEIGHTS.experience +
    keywords * WEIGHTS.keywords +
    seniority * WEIGHTS.seniority,
  );

  const { strengths, gaps } = deriveSignals(job, candidate, breakdown, skillSet, blob);

  return {
    overall,
    breakdown,
    strengths,
    gaps,
    reasoning: buildReasoning(job, candidate, breakdown, overall),
    mode: 'heuristic',
  };
}

/** Derive human-readable strengths[] and gaps[] from the deterministic breakdown. */
function deriveSignals(
  job: JobSpec,
  candidate: CandidateProfile,
  b: MatchBreakdown,
  skillSet: Set<string>,
  blob: string,
): { strengths: string[]; gaps: string[] } {
  const strengths: string[] = [];
  const gaps: string[] = [];

  const matchedMust = job.mustHaveSkills.filter((s) => skillSet.has(normalize(s)) || containsTerm(blob, normalize(s)));
  const missingMust = job.mustHaveSkills.filter((s) => !(skillSet.has(normalize(s)) || containsTerm(blob, normalize(s))));
  const matchedNice = job.niceToHaveSkills.filter((s) => skillSet.has(normalize(s)) || containsTerm(blob, normalize(s)));

  if (matchedMust.length) strengths.push(`Matches ${matchedMust.length}/${job.mustHaveSkills.length} must-have skills: ${matchedMust.slice(0, 5).join(', ')}`);
  if (matchedNice.length) strengths.push(`Bonus skills: ${matchedNice.slice(0, 4).join(', ')}`);
  if (b.experience >= 90) strengths.push(`Meets the ${job.minYearsExperience}+ years experience bar (${candidate.yearsExperience} yrs)`);
  if (b.seniority >= 90) strengths.push(`Seniority aligned (${candidate.seniority} ≈ ${job.seniority})`);

  if (missingMust.length) gaps.push(`Missing must-have skills: ${missingMust.slice(0, 5).join(', ')}`);
  if (job.minYearsExperience > 0 && candidate.yearsExperience < job.minYearsExperience) {
    gaps.push(`Below required experience: ${candidate.yearsExperience} yrs vs ${job.minYearsExperience} required`);
  }
  if (b.seniority < 80) gaps.push(`Seniority mismatch: candidate is ${candidate.seniority}, role wants ${job.seniority}`);

  if (strengths.length === 0) strengths.push('Some transferable overlap with the role profile');
  if (gaps.length === 0) gaps.push('No significant gaps detected against the stated requirements');
  return { strengths, gaps };
}

function buildReasoning(job: JobSpec, candidate: CandidateProfile, b: MatchBreakdown, overall: number): string {
  return (
    `${candidate.name || 'Candidate'} scores ${overall}/100 for ${job.title}. ` +
    `Skills ${b.skills}, experience ${b.experience}, keywords ${b.keywords}, seniority ${b.seniority}. ` +
    `Computed deterministically from skill/keyword overlap, years-vs-requirement and seniority distance.`
  );
}

/* ───────────────────────── Ranking (the shared brain, both directions) ───────────────────────── */

/** Recruiter view: rank a pool of candidates for one job, best first. */
export function rankCandidates(job: JobSpec, candidates: CandidateProfile[]): RankedCandidate[] {
  return candidates
    .map((candidate) => ({ candidate, match: scoreMatch(job, candidate) }))
    .sort((a, b) => b.match.overall - a.match.overall);
}

/** Seeker view: rank a set of jobs for one candidate, best first. SAME math, transposed. */
export function rankJobs(candidate: CandidateProfile, jobs: Job[]): RankedJob[] {
  return jobs
    .map((job) => ({ job, match: scoreMatch(job.spec, candidate) }))
    .sort((a, b) => b.match.overall - a.match.overall);
}

/* ───────────────────────── Optional AI enrichment (never changes numbers) ───────────────────────── */

const EnrichmentSchema = z.object({
  reasoning: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
});

/**
 * Enrich a base (heuristic) MatchResult's narrative using AI. The deterministic numeric
 * breakdown and overall are preserved verbatim; only reasoning/strengths/gaps improve and
 * the mode flips to 'ai'. Falls back to `base` unchanged when AI is unavailable.
 */
export async function enrichMatchWithAI(
  job: JobSpec,
  candidate: CandidateProfile,
  base: MatchResult,
): Promise<MatchResult> {
  const enriched = await completeJSON(
    EnrichmentSchema,
    'You are a precise technical recruiter. Explain a match using ONLY the supplied data. ' +
      'Do not invent skills. Return reasoning (2-3 sentences), strengths[] and gaps[].',
    JSON.stringify({
      job: { title: job.title, seniority: job.seniority, mustHaveSkills: job.mustHaveSkills, niceToHaveSkills: job.niceToHaveSkills, minYearsExperience: job.minYearsExperience },
      candidate: { name: candidate.name, headline: candidate.headline, skills: candidate.skills, seniority: candidate.seniority, yearsExperience: candidate.yearsExperience },
      deterministicScore: { overall: base.overall, breakdown: base.breakdown },
    }),
  );

  if (!enriched) return base;
  return {
    ...base, // keep overall + breakdown exactly
    reasoning: enriched.reasoning || base.reasoning,
    strengths: enriched.strengths.length ? enriched.strengths : base.strengths,
    gaps: enriched.gaps.length ? enriched.gaps : base.gaps,
    mode: 'ai',
  };
}
