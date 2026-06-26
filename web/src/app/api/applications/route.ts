/**
 * /api/applications — the seeker's application tracker (mirror of the recruiter pipeline).
 * GET ?seekerId → list. POST → create. PATCH → update status (audited).
 */
import { z } from 'zod';
import { Application, ApplicationStatus } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { draftCoverLetter } from '@/lib/matching/tailor';
import { ok, fail, readJson, newId, nowIso, requireUser, handleError } from '../_helpers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    requireUser(req);
    const seekerId = new URL(req.url).searchParams.get('seekerId') ?? undefined;
    return ok(getRepo().listApplications(seekerId));
  } catch (e) {
    return handleError(e);
  }
}

const CreateSchema = z.object({
  seekerId: z.string().min(1),
  jobId: z.string().min(1),
  coverLetter: z.string().optional(),
  /** When true and no coverLetter supplied, auto-draft one (AI + heuristic fallback). */
  autoCoverLetter: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    requireUser(req);
    const parsed = CreateSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const repo = getRepo();

    const job = repo.getJob(parsed.data.jobId);
    if (!job) return fail(`Job ${parsed.data.jobId} not found`, 404);
    const seeker = repo.getSeeker(parsed.data.seekerId);
    if (!seeker) return fail(`Seeker ${parsed.data.seekerId} not found`, 404);

    let coverLetter = parsed.data.coverLetter ?? '';
    if (!coverLetter && parsed.data.autoCoverLetter) {
      coverLetter = await draftCoverLetter(seeker.profile, job.spec);
    }

    const application = Application.parse({
      id: newId('app'),
      seekerId: parsed.data.seekerId,
      jobId: parsed.data.jobId,
      jobTitle: job.spec.title,
      company: job.company,
      status: 'Applied',
      coverLetter,
      appliedAt: nowIso(),
    });
    const created = repo.createApplication(application);
    repo.audit({ actor: parsed.data.seekerId, action: 'application.create', target: created.id });
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}

const PatchSchema = z.object({ id: z.string().min(1), status: ApplicationStatus });

export async function PATCH(req: Request) {
  try {
    requireUser(req);
    const parsed = PatchSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const repo = getRepo();
    const updated = repo.setApplicationStatus(parsed.data.id, parsed.data.status);
    if (!updated) return fail(`Application ${parsed.data.id} not found`, 404);
    repo.audit({ actor: updated.seekerId, action: `application.status.${parsed.data.status}`, target: updated.id });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
