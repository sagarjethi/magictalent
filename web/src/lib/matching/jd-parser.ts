/**
 * Job-description parser: raw JD text → structured JobSpec.
 * AI path (completeJSON) with a robust regex/keyword heuristic fallback so it works offline.
 */
import { z } from 'zod';
import { JobSpec, SeniorityLevel } from '@/lib/domain/types';
import { completeJSON } from '@/lib/ai/client';
import { extractSkills, extractYears, inferSeniority, TECH_KEYWORDS } from './keywords';

const ParsedJobSchema = z.object({
  title: z.string(),
  seniority: SeniorityLevel,
  mustHaveSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  minYearsExperience: z.number().int().min(0).max(50),
  location: z.string().optional(),
  remote: z.boolean(),
  summary: z.string(),
});

/** Parse a raw job description into a JobSpec. Always resolves (never throws). */
export async function parseJobDescription(raw: string, company?: string): Promise<JobSpec> {
  const ai = await completeJSON(
    ParsedJobSchema,
    'You are an expert technical recruiter. Extract a structured job spec from the JD. ' +
      'mustHaveSkills are required; niceToHaveSkills are preferred; keywords are notable terms. ' +
      'seniority ∈ intern|junior|mid|senior|staff|principal|lead. Use the company if provided.',
    `Company: ${company ?? 'unknown'}\n\nJob description:\n${raw}`,
  );
  if (ai) return JobSpec.parse(ai);
  return heuristicParseJD(raw, company);
}

/** Deterministic fallback JD parser using regex + the curated tech vocabulary. */
export function heuristicParseJD(raw: string, company?: string): JobSpec {
  const firstLine = raw.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? 'Software Engineer';
  // Trim a headline-style first line to just the role phrase (cut at sentence end or " at <Company>").
  const trimmedFirst = firstLine.split(/(?:\.\s)|(?:\s+at\s+)|(?:\s*[—-]\s*)/i)[0].trim().slice(0, 80);
  const title = extractTitle(raw) ?? (trimmedFirst || firstLine.slice(0, 80));

  const allSkills = extractSkills(raw, TECH_KEYWORDS);
  // Split must vs nice by proximity to "nice to have"/"preferred" sections.
  const niceSectionMatch = raw.toLowerCase().split(/nice to have|preferred|bonus|plus(?:es)?:/)[1] ?? '';
  const niceSkills = extractSkills(niceSectionMatch, TECH_KEYWORDS);
  const niceSet = new Set(niceSkills);
  const mustHaveSkills = allSkills.filter((s) => !niceSet.has(s));
  const niceToHaveSkills = niceSkills;

  const remote = /\bremote\b|work from home|wfh|distributed team/i.test(raw);

  return JobSpec.parse({
    title,
    seniority: inferSeniority(`${title} ${raw}`),
    mustHaveSkills: mustHaveSkills.length ? mustHaveSkills : allSkills,
    niceToHaveSkills,
    keywords: allSkills.slice(0, 12),
    minYearsExperience: extractYears(raw),
    location: extractLocation(raw),
    remote,
    summary: buildSummary(raw),
  });
}

function extractTitle(raw: string): string | undefined {
  const m = raw.match(/(?:title|role|position)\s*[:\-]\s*(.+)/i);
  if (m) return m[1].trim().slice(0, 120);
  return undefined;
}

function extractLocation(raw: string): string | undefined {
  const m = raw.match(/(?:location|based in|located in)\s*[:\-]?\s*([A-Za-z .,'-]{2,40})/i);
  return m ? m[1].trim() : undefined;
}

function buildSummary(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  return cleaned.length > 240 ? `${cleaned.slice(0, 237)}...` : cleaned;
}
