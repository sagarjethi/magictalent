/**
 * /api/seeker/profile — the seeker's own profile.
 * GET ?seekerId → fetch one (or list all when omitted).
 * POST { rawResume, name, email } → parse the resume into a matcher-ready CandidateProfile + upsert.
 */
import { z } from 'zod';
import { SeekerProfile, CandidateProfile } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { parseResume } from '@/lib/matching/resume-parser';
import { ok, fail, readJson, newId, nowIso, requireUser, handleError } from '../../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const seekerId = new URL(req.url).searchParams.get('seekerId');
    if (!seekerId) return ok(getRepo().listSeekers());
    const seeker = getRepo().getSeeker(seekerId);
    if (!seeker) return fail(`Seeker ${seekerId} not found`, 404);
    return ok(seeker);
  } catch (e) {
    return handleError(e);
  }
}

const BodySchema = z.object({
  rawResume: z.string().min(1, 'rawResume is required'),
  name: z.string().min(1, 'name is required'),
  email: z.string().email().or(z.literal('')).optional(),
  id: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const repo = getRepo();

    const id = parsed.data.id ?? newId('seeker');
    const r = await parseResume(parsed.data.rawResume);

    const profile = CandidateProfile.parse({
      id,
      name: parsed.data.name,
      headline: r.headline,
      skills: r.skills,
      seniority: r.seniority,
      yearsExperience: r.yearsExperience,
      location: parsed.data.location,
      openToRemote: true,
      experience: r.experience,
      summary: r.summary,
      source: 'internal-pool',
      sourceId: id,
      sourceUrl: undefined,
      sourcedAt: nowIso(),
    });

    const seeker = SeekerProfile.parse({
      id,
      name: parsed.data.name,
      email: parsed.data.email ?? '',
      rawResume: parsed.data.rawResume,
      profile,
      createdAt: nowIso(),
    });

    const saved = repo.upsertSeeker(seeker);
    repo.audit({ actor: id, action: 'seeker.upsert', target: id });
    return ok(saved, 201);
  } catch (e) {
    return handleError(e);
  }
}
