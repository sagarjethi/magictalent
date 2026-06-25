/**
 * RepoService — DI wrapper over the process-singleton Repository (getRepo()).
 * Every request shares one seeded in-memory store, so data persists across requests.
 */
import { Injectable } from '@nestjs/common';
import { getRepo } from '../lib/db';
import type { Repository } from '../lib/db/repository';

@Injectable()
export class RepoService {
  get(): Repository {
    return getRepo();
  }
}
