/**
 * GitHub source adapter.
 * With GITHUB_TOKEN: queries the GitHub Search Users API, maps users → CandidateProfile,
 * enriches via their repos (languages → skills), and respects rate limits with a simple governor.
 * Without a token: degrades to a small built-in SAMPLE of plausible github-style candidates so
 * the flow works fully offline. NEVER throws on network failure — returns [] or the sample.
 */
import { z } from 'zod';
import type { JobSpec, CandidateProfile, SourceType } from '../domain/types';
import { CandidateProfile as CandidateProfileSchema } from '../domain/types';
import type { SourceAdapter, SearchOptions, RateLimitStatus } from './source-adapter';
import { extractSkills, inferSeniority, normalize, TECH_KEYWORDS } from '../matching/keywords';

const GH_API = 'https://api.github.com';

/* ── zod schemas for the untrusted GitHub responses ── */
const GhUserSearchSchema = z.object({
  items: z.array(z.object({
    login: z.string(),
    id: z.number(),
    html_url: z.string(),
    url: z.string(),
  })).default([]),
});
const GhUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  html_url: z.string(),
  public_repos: z.number().optional(),
  created_at: z.string().optional(),
});
const GhReposSchema = z.array(z.object({
  language: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  topics: z.array(z.string()).optional(),
  stargazers_count: z.number().optional(),
}));

export class GithubAdapter implements SourceAdapter {
  private remaining = 30; // search API default unauthenticated-ish budget; refined from headers
  private resetAt = new Date(Date.now() + 60_000).toISOString();

  getSourceType(): SourceType {
    return 'github';
  }

  isEnabled(): boolean {
    return true; // always enabled — degrades to sample without a token
  }

  private token(): string | undefined {
    return process.env.GITHUB_TOKEN;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'jobmagic-sourcing-agent',
    };
    const t = this.token();
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }

  async search(spec: JobSpec, opts?: SearchOptions): Promise<CandidateProfile[]> {
    if (!this.token()) return sampleCandidates(spec, opts?.limit ?? 8);
    if (this.remaining <= 0) return sampleCandidates(spec, Math.min(opts?.limit ?? 8, 5));

    const limit = Math.min(opts?.limit ?? 10, 15);
    const query = buildQuery(spec);
    try {
      const res = await fetch(`${GH_API}/search/users?q=${encodeURIComponent(query)}&per_page=${limit}`, {
        headers: this.headers(),
        signal: opts?.signal,
      });
      this.updateRateLimit(res);
      if (!res.ok) return sampleCandidates(spec, Math.min(limit, 5));
      const json = GhUserSearchSchema.safeParse(await res.json());
      if (!json.success) return sampleCandidates(spec, Math.min(limit, 5));

      // Hydrate a bounded number of users (avoid burning the rate budget).
      const out: CandidateProfile[] = [];
      for (const item of json.data.items.slice(0, limit)) {
        const profile = await this.hydrateUser(item.login, item.id, item.html_url, opts?.signal);
        if (profile) out.push(profile);
        if (this.remaining <= 1) break;
      }
      return out.length ? out : sampleCandidates(spec, Math.min(limit, 5));
    } catch {
      return sampleCandidates(spec, Math.min(limit, 5));
    }
  }

  private async hydrateUser(login: string, id: number, htmlUrl: string, signal?: AbortSignal): Promise<CandidateProfile | null> {
    try {
      const res = await fetch(`${GH_API}/users/${login}`, { headers: this.headers(), signal });
      this.updateRateLimit(res);
      if (!res.ok) return baseProfile(login, id, htmlUrl, '');
      const u = GhUserSchema.safeParse(await res.json());
      if (!u.success) return baseProfile(login, id, htmlUrl, '');
      const bio = u.data.bio ?? '';
      const profile = baseProfile(login, id, htmlUrl, bio, u.data.name ?? undefined, u.data.location ?? undefined);
      profile.skills = extractSkills(bio, TECH_KEYWORDS);
      profile.seniority = inferSeniority(bio);
      return profile;
    } catch {
      return baseProfile(login, id, htmlUrl, '');
    }
  }

  async enrichProfile(candidate: CandidateProfile): Promise<CandidateProfile> {
    if (candidate.source !== 'github' || !this.token()) return candidate;
    if (this.remaining <= 1) return candidate;
    try {
      const res = await fetch(`${GH_API}/users/${candidate.sourceId.replace(/^github:/, '')}/repos?per_page=30&sort=pushed`, {
        headers: this.headers(),
      });
      this.updateRateLimit(res);
      if (!res.ok) return candidate;
      const repos = GhReposSchema.safeParse(await res.json());
      if (!repos.success) return candidate;

      const langs = new Set(candidate.skills.map(normalize));
      const repoText = repos.data
        .map((r) => `${r.language ?? ''} ${r.description ?? ''} ${(r.topics ?? []).join(' ')}`)
        .join(' ');
      for (const s of extractSkills(repoText, TECH_KEYWORDS)) langs.add(normalize(s));
      for (const r of repos.data) if (r.language) langs.add(normalize(r.language));

      return { ...candidate, skills: [...langs] };
    } catch {
      return candidate;
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    return { remaining: this.remaining, resetAt: this.resetAt };
  }

  private updateRateLimit(res: Response): void {
    const rem = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');
    if (rem !== null) this.remaining = parseInt(rem, 10);
    if (reset !== null) this.resetAt = new Date(parseInt(reset, 10) * 1000).toISOString();
  }
}

/** Build a GitHub user-search query from the spec (top skills + location). */
function buildQuery(spec: JobSpec): string {
  const skills = spec.mustHaveSkills.slice(0, 3);
  const parts = skills.map((s) => `language:${s.replace(/[^\w.+#-]/g, '')}`).filter((p) => p !== 'language:');
  // Also include free-text skill terms to widen recall.
  const terms = skills.map((s) => s).join(' ');
  if (spec.location && !spec.remote) parts.push(`location:${spec.location.split(',')[0].trim()}`);
  parts.push('type:user');
  return `${terms} ${parts.join(' ')}`.trim();
}

function baseProfile(login: string, id: number, htmlUrl: string, bio: string, name?: string, location?: string): CandidateProfile {
  return CandidateProfileSchema.parse({
    id: `github-${id}`,
    name: name || login,
    headline: bio.slice(0, 80) || `GitHub developer @${login}`,
    skills: [],
    seniority: 'mid',
    yearsExperience: 0,
    location: location || undefined,
    openToRemote: true,
    experience: [],
    summary: bio,
    source: 'github',
    sourceId: `github:${login}`,
    sourceUrl: htmlUrl,
    sourcedAt: new Date().toISOString(),
  });
}

/* ── Offline sample: plausible github-style candidates, clearly provenance-tagged ── */
const SAMPLE_SEED: Array<{ login: string; name: string; bio: string; skills: string[]; seniority: CandidateProfile['seniority']; years: number; location: string }> = [
  { login: 'octo-ada', name: 'Ada Okoye', bio: 'Senior full-stack engineer. TypeScript, React, Node.js, AWS.', skills: ['typescript', 'react', 'node.js', 'aws', 'graphql'], seniority: 'senior', years: 8, location: 'Remote' },
  { login: 'grace-builds', name: 'Grace Lindqvist', bio: 'Backend engineer focused on distributed systems in Go and Kubernetes.', skills: ['go', 'kubernetes', 'docker', 'postgresql', 'grpc'], seniority: 'senior', years: 7, location: 'Berlin, DE' },
  { login: 'hopper-dev', name: 'Marco Reyes', bio: 'Python data/ML engineer. PyTorch, Airflow, Spark.', skills: ['python', 'pytorch', 'airflow', 'spark', 'sql'], seniority: 'mid', years: 4, location: 'Remote' },
  { login: 'turing-fe', name: 'Priya Nair', bio: 'Frontend engineer. React, Next.js, Tailwind, accessibility.', skills: ['react', 'next.js', 'typescript', 'tailwind', 'css'], seniority: 'mid', years: 5, location: 'Bengaluru, IN' },
  { login: 'lovelace-staff', name: 'Daniel Cho', bio: 'Staff engineer. Microservices, AWS, system design, Java/Kotlin.', skills: ['java', 'kotlin', 'aws', 'microservices', 'system design'], seniority: 'staff', years: 11, location: 'Remote' },
  { login: 'knuth-jr', name: 'Sara Müller', bio: 'Junior developer eager to learn. JavaScript, React, Node.', skills: ['javascript', 'react', 'node.js', 'html', 'css'], seniority: 'junior', years: 1, location: 'Remote' },
  { login: 'ritchie-cloud', name: 'Tomás Alvarez', bio: 'DevOps/SRE. Terraform, Kubernetes, GCP, CI/CD, observability.', skills: ['terraform', 'kubernetes', 'gcp', 'ci/cd', 'prometheus'], seniority: 'senior', years: 9, location: 'Madrid, ES' },
  { login: 'lamport-mobile', name: 'Yuki Tanaka', bio: 'Mobile engineer. Swift, SwiftUI, Kotlin, Flutter.', skills: ['swift', 'swiftui', 'kotlin', 'flutter', 'ios'], seniority: 'mid', years: 6, location: 'Tokyo, JP' },
];

function sampleCandidates(spec: JobSpec, limit: number): CandidateProfile[] {
  const now = new Date().toISOString();
  const profiles = SAMPLE_SEED.map((s) =>
    CandidateProfileSchema.parse({
      id: `github-sample-${s.login}`,
      name: s.name,
      headline: s.bio.slice(0, 80),
      skills: s.skills,
      seniority: s.seniority,
      yearsExperience: s.years,
      location: s.location,
      openToRemote: /remote/i.test(s.location),
      experience: [],
      summary: `${s.bio} (offline GitHub sample — no GITHUB_TOKEN configured)`,
      source: 'github',
      sourceId: `github:${s.login}`,
      sourceUrl: `https://github.com/${s.login}`,
      sourcedAt: now,
    }),
  );
  // Rough relevance sort so the sample respects the spec's skills.
  const want = new Set([...spec.mustHaveSkills, ...spec.niceToHaveSkills].map(normalize));
  return profiles
    .map((p) => ({ p, hits: p.skills.filter((sk) => want.has(normalize(sk))).length }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((r) => r.p);
}
