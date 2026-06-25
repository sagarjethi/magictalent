/**
 * SourcingService — DI wrapper over the multi-source candidate pipeline.
 */
import { Injectable } from '@nestjs/common';
import type { JobSpec, CandidateProfile } from '../lib/domain/types';
import type { SearchOptions } from '../lib/sources/source-adapter';
import { searchAllSources, dedupeCandidates } from '../lib/sources/source-factory';

@Injectable()
export class SourcingService {
  searchAllSources(spec: JobSpec, opts?: SearchOptions): Promise<CandidateProfile[]> {
    return searchAllSources(spec, opts);
  }

  dedupe(candidates: CandidateProfile[]): CandidateProfile[] {
    return dedupeCandidates(candidates);
  }
}
