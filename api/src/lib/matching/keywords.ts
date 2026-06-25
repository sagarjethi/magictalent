/**
 * Shared lexical helpers for the heuristic (no-API-key) paths of the matching engine.
 * A curated tech-skill vocabulary plus normalization + extraction utilities used by
 * jd-parser, resume-parser, ats and the scorer so every heuristic agrees on terms.
 */

/** Curated, lowercase tech vocabulary. Multi-word terms first so they win over substrings. */
export const TECH_KEYWORDS: string[] = [
  // languages
  'typescript', 'javascript', 'python', 'java', 'kotlin', 'swift', 'go', 'golang', 'rust',
  'c++', 'c#', 'ruby', 'php', 'scala', 'elixir', 'haskell', 'dart', 'sql', 'bash', 'r',
  // frontend
  'react', 'react native', 'next.js', 'nextjs', 'vue', 'nuxt', 'angular', 'svelte',
  'redux', 'tailwind', 'tailwind css', 'css', 'html', 'webpack', 'vite', 'graphql',
  // backend / frameworks
  'node.js', 'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring',
  'spring boot', 'rails', 'laravel', '.net', 'asp.net', 'gin',
  // data / ml
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka',
  'rabbitmq', 'snowflake', 'spark', 'hadoop', 'airflow', 'dbt', 'pandas', 'numpy',
  'pytorch', 'tensorflow', 'scikit-learn', 'machine learning', 'deep learning',
  'nlp', 'llm', 'langchain', 'pytorch lightning',
  // cloud / devops
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
  'jenkins', 'github actions', 'ci/cd', 'cicd', 'prometheus', 'grafana', 'helm',
  'serverless', 'lambda', 'microservices', 'rest', 'rest api', 'grpc', 'websocket',
  // mobile
  'android', 'ios', 'flutter', 'jetpack compose', 'swiftui',
  // practices
  'agile', 'scrum', 'tdd', 'system design', 'distributed systems', 'oauth', 'jwt',
];

/** Action verbs that signal strong, achievement-oriented resume bullets. */
export const ACTION_VERBS: string[] = [
  'led', 'built', 'designed', 'developed', 'launched', 'shipped', 'created', 'architected',
  'implemented', 'improved', 'increased', 'reduced', 'optimized', 'scaled', 'migrated',
  'delivered', 'drove', 'owned', 'managed', 'mentored', 'spearheaded', 'automated',
  'streamlined', 'engineered', 'established', 'transformed', 'accelerated',
];

export function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Tokenize text to a lowercase word set (alnum, +, #, ., -) for membership tests. */
export function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#.\-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
  );
}

/** Whole-term presence test that tolerates multi-word phrases. */
export function containsTerm(haystack: string, term: string): boolean {
  const h = haystack.toLowerCase();
  const t = term.toLowerCase();
  if (t.includes(' ') || t.includes('/') || /[+#.]/.test(t)) return h.includes(t);
  // single word: match on word boundary to avoid 'go' matching 'google'
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(t)}([^a-z0-9]|$)`, 'i').test(h);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract known tech skills from free text, de-duplicated, preserving first-seen order. */
export function extractSkills(text: string, vocab: string[] = TECH_KEYWORDS): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const term of vocab) {
    if (containsTerm(text, term) && !seen.has(term)) {
      seen.add(term);
      found.push(term);
    }
  }
  return found;
}

/** Best-effort years-of-experience extraction from prose (e.g. "5+ years"). */
export function extractYears(text: string): number {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi)];
  let max = 0;
  for (const m of matches) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n > max && n <= 50) max = n;
  }
  return max;
}

import type { SeniorityLevel } from '../domain/types';

/** Numeric rank of a seniority level for distance math (the shared scale). */
export const SENIORITY_RANK: Record<SeniorityLevel, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  staff: 5,
  principal: 6,
};

/** Infer a seniority level from free text; defaults to 'mid'. */
export function inferSeniority(text: string): SeniorityLevel {
  const t = text.toLowerCase();
  if (/\bprincipal\b/.test(t)) return 'principal';
  if (/\bstaff\b/.test(t)) return 'staff';
  if (/\b(lead|team lead|tech lead)\b/.test(t)) return 'lead';
  if (/\b(senior|sr\.?|sr)\b/.test(t)) return 'senior';
  if (/\b(intern|internship)\b/.test(t)) return 'intern';
  if (/\b(junior|jr\.?|entry[- ]level|graduate|new grad)\b/.test(t)) return 'junior';
  return 'mid';
}
