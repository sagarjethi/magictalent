/**
 * ATS readiness scorer: raw resume text → AtsReport (score + issues[] + strengths[]).
 * AI path with a deterministic, rule-based heuristic fallback.
 */
import { z } from 'zod';
import { AtsReport } from '@/lib/domain/types';
import { completeJSON } from '@/lib/ai/client';
import { ACTION_VERBS, extractSkills, TECH_KEYWORDS } from './keywords';

const AtsAiSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.object({
    severity: z.enum(['high', 'medium', 'low']),
    message: z.string(),
    fix: z.string(),
  })),
  strengths: z.array(z.string()),
});

/** Score a resume's ATS-readiness. Always resolves (never throws). */
export async function scoreAts(raw: string): Promise<AtsReport> {
  const ai = await completeJSON(
    AtsAiSchema,
    'You are an ATS (applicant tracking system) auditor. Score the resume 0-100 for ATS ' +
      'readiness and machine-parseability. Return concrete issues (severity high|medium|low, ' +
      'message, fix) and strengths. Penalize missing contact info, no metrics, weak verbs, ' +
      'missing section headers, poor length, low keyword density.',
    `Resume:\n${raw}`,
  );
  if (ai) return AtsReport.parse({ ...ai, mode: 'ai' });
  return heuristicAts(raw);
}

/** Deterministic ATS heuristic. */
export function heuristicAts(raw: string): AtsReport {
  const text = raw.toLowerCase();
  const issues: AtsReport['issues'] = [];
  const strengths: string[] = [];
  let score = 100;

  // 1. Contact info
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(raw);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(raw);
  if (!hasEmail) { issues.push({ severity: 'high', message: 'No email address detected.', fix: 'Add a professional email at the top of your resume.' }); score -= 15; }
  else strengths.push('Contact email present');
  if (!hasPhone) { issues.push({ severity: 'medium', message: 'No phone number detected.', fix: 'Add a phone number to your contact header.' }); score -= 6; }

  // 2. Section headers
  const sections = ['experience', 'education', 'skills'];
  const missingSections = sections.filter((s) => !text.includes(s));
  if (missingSections.length) {
    issues.push({ severity: 'high', message: `Missing standard section header(s): ${missingSections.join(', ')}.`, fix: 'Use clear, standard headings (Experience, Education, Skills) so parsers can segment your resume.' });
    score -= missingSections.length * 8;
  } else strengths.push('All standard section headers present');

  // 3. Action verbs
  const verbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, 'i').test(raw)).length;
  if (verbHits < 3) { issues.push({ severity: 'medium', message: 'Few strong action verbs.', fix: 'Begin bullets with verbs like Led, Built, Improved, Reduced.' }); score -= 10; }
  else strengths.push(`Strong action verbs used (${verbHits} distinct)`);

  // 4. Quantified achievements
  const hasMetrics = /\b\d+%|\$\d|\b\d+\s*(?:x|users|customers|requests|ms|qps|hours|days)\b/i.test(raw);
  if (!hasMetrics) { issues.push({ severity: 'high', message: 'No quantified achievements.', fix: 'Add metrics (e.g. "cut latency 40%", "served 2M users") to demonstrate impact.' }); score -= 14; }
  else strengths.push('Quantified, metric-driven achievements');

  // 5. Length
  const words = raw.split(/\s+/).filter(Boolean).length;
  if (words < 150) { issues.push({ severity: 'medium', message: 'Resume looks too short.', fix: 'Expand to ~400-700 words covering experience, skills and impact.' }); score -= 10; }
  else if (words > 1200) { issues.push({ severity: 'low', message: 'Resume may be too long.', fix: 'Trim to the most relevant 1-2 pages.' }); score -= 4; }
  else strengths.push('Appropriate length');

  // 6. Keyword density
  const skills = extractSkills(raw, TECH_KEYWORDS);
  if (skills.length < 4) { issues.push({ severity: 'medium', message: 'Low technical keyword density.', fix: 'List concrete tools/technologies in a Skills section to pass keyword filters.' }); score -= 8; }
  else strengths.push(`Healthy keyword density (${skills.length} recognized skills)`);

  if (strengths.length === 0) strengths.push('Resume contains parseable text');

  return AtsReport.parse({
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues,
    strengths,
    mode: 'heuristic',
  });
}
