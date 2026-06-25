/**
 * Source factory — assembles the set of enabled candidate sources.
 * internal-pool + github are always enabled (github degrades to an offline sample).
 * linkedin/naukri are gated OFF unless their ENABLE_* env flag is set (legal/licensing).
 */
import 'server-only';
import type { JobSpec, CandidateProfile } from '@/lib/domain/types';
import type { SourceAdapter, SearchOptions } from './source-adapter';
import { InternalPoolAdapter } from './internal-pool-adapter';
import { GithubAdapter } from './github-adapter';

export function getEnabledAdapters(): SourceAdapter[] {
  const adapters: SourceAdapter[] = [new InternalPoolAdapter(), new GithubAdapter()];

  // Gated sources: present in the design, excluded unless explicitly enabled.
  // (No concrete LinkedIn/Naukri adapters ship in the MVP — scraping is ruled out.)
  if (process.env.ENABLE_LINKEDIN === 'true') {
    // would push new LinkedInAdapter() once a compliant integration exists
  }
  if (process.env.ENABLE_NAUKRI === 'true') {
    // would push new NaukriAdapter() once a compliant integration exists
  }

  return adapters.filter((a) => a.isEnabled());
}

/**
 * Fan out a search across all enabled adapters, then normalize + dedupe the union.
 * Never throws — a failing adapter contributes nothing. Shared by the quick /source
 * route and the Sourcing Agent so both produce the same candidate set.
 */
export async function searchAllSources(spec: JobSpec, opts?: SearchOptions): Promise<CandidateProfile[]> {
  const adapters = getEnabledAdapters();
  const results = await Promise.all(
    adapters.map(async (a) => {
      try {
        return await a.search(spec, opts);
      } catch {
        return [] as CandidateProfile[];
      }
    }),
  );
  return dedupeCandidates(results.flat());
}

/** Dedupe by source identity first, then by loose human identity (name+location). */
export function dedupeCandidates(candidates: CandidateProfile[]): CandidateProfile[] {
  const bySource = new Map<string, CandidateProfile>();
  for (const c of candidates) {
    const key = `${c.source}:${c.sourceId}`;
    if (!bySource.has(key)) bySource.set(key, c);
  }
  const byIdentity = new Map<string, CandidateProfile>();
  for (const c of bySource.values()) {
    const idKey = `${c.name.toLowerCase().trim()}|${(c.location ?? '').toLowerCase().trim()}`;
    const existing = byIdentity.get(idKey);
    // Prefer the richer profile (more skills) when the same person appears twice.
    if (!existing || c.skills.length > existing.skills.length) byIdentity.set(idKey, c);
  }
  return [...byIdentity.values()];
}
