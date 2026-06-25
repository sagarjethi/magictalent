/**
 * Resume parser: raw resume text → structured, matcher-ready candidate fields.
 * AI path with deterministic heuristic fallback (same curated tech vocabulary).
 */
import { z } from 'zod';
import { SeniorityLevel, ExperienceItem } from '@/lib/domain/types';
import type { ExperienceItem as ExperienceItemType, SeniorityLevel as SeniorityLevelType } from '@/lib/domain/types';
import { completeJSON } from '@/lib/ai/client';
import { extractSkills, extractYears, inferSeniority, TECH_KEYWORDS, ACTION_VERBS } from './keywords';

export interface ParsedResume {
  headline: string;
  skills: string[];
  seniority: SeniorityLevelType;
  yearsExperience: number;
  experience: ExperienceItemType[];
  summary: string;
}

const ParsedResumeSchema = z.object({
  headline: z.string(),
  skills: z.array(z.string()),
  seniority: SeniorityLevel,
  yearsExperience: z.number().min(0).max(50),
  experience: z.array(ExperienceItem),
  summary: z.string(),
});

/** Parse a raw resume into structured fields. Always resolves (never throws). */
export async function parseResume(raw: string): Promise<ParsedResume> {
  const ai = await completeJSON(
    ParsedResumeSchema,
    'You are an expert resume parser. Extract a candidate profile. seniority ∈ ' +
      'intern|junior|mid|senior|staff|principal|lead. yearsExperience is total professional years. ' +
      'experience is a list of {title, company, years, highlights[]}. Do not invent data.',
    `Resume:\n${raw}`,
  );
  if (ai) return ParsedResumeSchema.parse(ai);
  return heuristicParseResume(raw);
}

/** Deterministic fallback resume parser. */
export function heuristicParseResume(raw: string): ParsedResume {
  const skills = extractSkills(raw, TECH_KEYWORDS);
  const seniority = inferSeniority(raw);
  const yearsExperience = extractYears(raw);
  const headline = buildHeadline(raw, seniority);
  const experience = extractExperience(raw);

  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const summary = cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;

  return { headline, skills, seniority, yearsExperience, experience, summary };
}

function buildHeadline(raw: string, seniority: SeniorityLevelType): string {
  const m = raw.match(/(?:^|\n)\s*([A-Z][A-Za-z]+(?:\s+(?:Engineer|Developer|Designer|Manager|Scientist|Architect|Analyst))(?:\s+\w+)?)/);
  if (m) return m[1].trim().slice(0, 80);
  const role = /(engineer|developer|designer|manager|scientist|architect|analyst)/i.exec(raw)?.[1] ?? 'Engineer';
  return `${seniority.charAt(0).toUpperCase()}${seniority.slice(1)} ${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

/** Pull a few experience-like lines (action-verb bullets) into structured items. */
function extractExperience(raw: string): ExperienceItemType[] {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const highlights = lines
    .filter((l) => ACTION_VERBS.some((v) => new RegExp(`^[\\-*•\\s]*${v}\\b`, 'i').test(l)))
    .slice(0, 5);

  // Try to find a role/company header line.
  const header = lines.find((l) => /(engineer|developer|manager|designer|scientist|architect|analyst)/i.test(l)) ?? 'Experience';
  const years = extractYears(raw);

  if (highlights.length === 0) return [];
  return [
    {
      title: header.slice(0, 80),
      company: '',
      years,
      highlights,
    },
  ];
}
