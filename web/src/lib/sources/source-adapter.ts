/**
 * SourceAdapter contract — every candidate source implements this one interface so the
 * matcher and UI stay source-agnostic. (Proven design ported from TalentScout.)
 */
import type { JobSpec, CandidateProfile, SourceType } from '@/lib/domain/types';

export interface SearchOptions {
  limit?: number;
  signal?: AbortSignal;
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: string; // ISO
}

export interface SourceAdapter {
  getSourceType(): SourceType;
  /** Licensed/gated sources return false unless their env flag + credentials are present. */
  isEnabled(): boolean;
  search(spec: JobSpec, opts?: SearchOptions): Promise<CandidateProfile[]>;
  enrichProfile(candidate: CandidateProfile): Promise<CandidateProfile>;
  getRateLimitStatus(): Promise<RateLimitStatus>;
}
