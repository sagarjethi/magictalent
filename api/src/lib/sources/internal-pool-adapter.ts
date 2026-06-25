/**
 * Internal-pool source adapter — the two-sided flywheel.
 * The platform's own job-seeker profiles become a first-class candidate source for recruiters.
 * Always enabled, never rate-limited, never throws.
 */
import type { JobSpec, CandidateProfile, SourceType } from '../domain/types';
import { getRepo } from '../db';
import type { SourceAdapter, SearchOptions, RateLimitStatus } from './source-adapter';
import { scoreMatch } from '../matching/scorer';

export class InternalPoolAdapter implements SourceAdapter {
  getSourceType(): SourceType {
    return 'internal-pool';
  }

  isEnabled(): boolean {
    return true;
  }

  async search(spec: JobSpec, opts?: SearchOptions): Promise<CandidateProfile[]> {
    const limit = opts?.limit ?? 25;
    let pool: CandidateProfile[] = [];
    try {
      pool = getRepo().internalCandidatePool();
    } catch {
      return [];
    }
    // Loose pre-rank by the shared scorer so the strongest internal candidates surface first.
    return pool
      .map((candidate) => ({ candidate, overall: scoreMatch(spec, candidate).overall }))
      .sort((a, b) => b.overall - a.overall)
      .slice(0, limit)
      .map((r) => r.candidate);
  }

  async enrichProfile(candidate: CandidateProfile): Promise<CandidateProfile> {
    // Internal profiles are already fully parsed; nothing to enrich.
    return candidate;
  }

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    return { remaining: Number.MAX_SAFE_INTEGER, resetAt: new Date(Date.now() + 3600_000).toISOString() };
  }
}
