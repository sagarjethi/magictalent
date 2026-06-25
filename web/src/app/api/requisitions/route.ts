/**
 * /api/requisitions — list requisitions (GET) and create one from a raw JD (POST).
 * POST parses the JD via the matching engine (AI + heuristic fallback) into a JobSpec.
 */
import { z } from 'zod';
import { Requisition } from '@/lib/domain/types';
import { getRepo } from '@/lib/db';
import { parseJobDescription } from '@/lib/matching/jd-parser';
import { ok, fail, readJson, newId, nowIso } from '../_helpers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return ok(getRepo().listRequisitions());
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

const CreateSchema = z.object({
  rawDescription: z.string().min(1, 'Job description is required'),
  company: z.string().min(1, 'Company is required'),
  ownerId: z.string().optional(),
  status: z.enum(['draft', 'open', 'closed']).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = CreateSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());

    const { rawDescription, company, ownerId, status } = parsed.data;
    const spec = await parseJobDescription(rawDescription, company);

    const requisition = Requisition.parse({
      id: newId('req'),
      spec,
      company,
      rawDescription,
      status: status ?? 'open',
      createdAt: nowIso(),
      ownerId: ownerId ?? 'recruiter-demo',
    });

    const created = getRepo().createRequisition(requisition);
    getRepo().audit({ actor: created.ownerId, action: 'requisition.create', target: created.id });
    return ok(created, 201);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
