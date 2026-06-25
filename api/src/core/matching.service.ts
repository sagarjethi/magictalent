/**
 * MatchingService — DI wrapper over the shared matching brain + content generation.
 * All methods delegate to the pure/heuristic-capable lib functions (graceful degradation).
 */
import { Injectable } from '@nestjs/common';
import type {
  JobSpec, CandidateProfile, MatchResult, RankedCandidate, RankedJob, Job, AtsReport,
} from '../lib/domain/types';
import { scoreMatch, enrichMatchWithAI, rankCandidates, rankJobs } from '../lib/matching/scorer';
import { parseJobDescription } from '../lib/matching/jd-parser';
import { parseResume, type ParsedResume } from '../lib/matching/resume-parser';
import { scoreAts } from '../lib/matching/ats';
import { tailorResumeSummary, draftCoverLetter, draftOutreach } from '../lib/matching/tailor';

@Injectable()
export class MatchingService {
  scoreMatch(job: JobSpec, candidate: CandidateProfile): MatchResult {
    return scoreMatch(job, candidate);
  }

  enrichMatch(job: JobSpec, candidate: CandidateProfile, base: MatchResult): Promise<MatchResult> {
    return enrichMatchWithAI(job, candidate, base);
  }

  rankCandidates(job: JobSpec, candidates: CandidateProfile[]): RankedCandidate[] {
    return rankCandidates(job, candidates);
  }

  rankJobs(candidate: CandidateProfile, jobs: Job[]): RankedJob[] {
    return rankJobs(candidate, jobs);
  }

  parseJobDescription(raw: string, company?: string): Promise<JobSpec> {
    return parseJobDescription(raw, company);
  }

  parseResume(raw: string): Promise<ParsedResume> {
    return parseResume(raw);
  }

  scoreAts(raw: string): Promise<AtsReport> {
    return scoreAts(raw);
  }

  tailorResumeSummary(profile: CandidateProfile, job: JobSpec): Promise<string> {
    return tailorResumeSummary(profile, job);
  }

  draftCoverLetter(profile: CandidateProfile, job: JobSpec): Promise<string> {
    return draftCoverLetter(profile, job);
  }

  draftOutreach(candidate: CandidateProfile, job: JobSpec): Promise<{ subject: string; body: string }> {
    return draftOutreach(candidate, job);
  }
}
