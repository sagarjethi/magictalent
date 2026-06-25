/**
 * Repository singleton accessor.
 *
 * For the MVP the in-memory store (`store.ts`) is the source of truth: it is
 * always available, deterministic, and keeps CI/build green with no native deps.
 *
 * The architecture's production target is SQLite via `better-sqlite3`
 * (see `schema.sql`). A SQLite-backed repository can be slotted in here behind
 * the same `Repository` interface without touching any call site. Until that
 * adapter is implemented and proven, we deliberately and reliably return the
 * in-memory store.
 *
 * Owned by the Backend Junior.
 */
import { InMemoryStore } from '@/lib/db/store';
import type { Repository } from '@/lib/db/repository';

let repo: Repository | undefined;

/** Construct the backing repository. In-memory is the guaranteed default. */
function createRepo(): Repository {
  return new InMemoryStore();
}

/** Module-level singleton — every call site shares one seeded store per process. */
export function getRepo(): Repository {
  if (!repo) repo = createRepo();
  return repo;
}

/** Drop the singleton so the next `getRepo()` rebuilds a freshly seeded store (tests). */
export function resetRepo(): void {
  repo = undefined;
}
