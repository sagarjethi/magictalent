/**
 * Seed summary CLI. Prints entity counts for the deterministic demo dataset.
 *
 * Run with: npx tsx scripts/seed.ts
 */
import { seedData } from '@/lib/db/seed';

function main(): void {
  const data = seedData();
  const counts: Record<string, number> = {
    jobs: data.jobs.length,
    seekers: data.seekers.length,
    requisitions: data.requisitions.length,
    pipelineCards: data.pipeline.length,
    applications: data.applications.length,
    outreach: data.outreach.length,
    audit: data.audit.length,
  };

  // eslint-disable-next-line no-console
  console.log('Jobmagic seed summary');
  // eslint-disable-next-line no-console
  console.log('─────────────────────');
  for (const [entity, count] of Object.entries(counts)) {
    // eslint-disable-next-line no-console
    console.log(`${entity.padEnd(14)} ${count}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  // eslint-disable-next-line no-console
  console.log('─────────────────────');
  // eslint-disable-next-line no-console
  console.log(`${'total'.padEnd(14)} ${total}`);
}

main();
