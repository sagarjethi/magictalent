/**
 * /api/ats — score a resume's ATS-readiness (AI + heuristic fallback).
 */
import { z } from 'zod';
import { scoreAts } from '@/lib/matching/ats';
import { ok, fail, readJson } from '../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({ rawResume: z.string().min(1, 'rawResume is required') });

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    return ok(await scoreAts(parsed.data.rawResume));
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
