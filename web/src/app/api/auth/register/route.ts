/**
 * POST /api/auth/register — { name, email, password, role } → AuthResult or 409 (dup email).
 */
import { z } from 'zod';
import { UserRole } from '@/lib/domain/types';
import { register } from '@/lib/auth/service';
import { ok, fail, readJson } from '../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('a valid email is required'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: UserRole,
  seekerId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const result = register(parsed.data);
    if ('error' in result) return fail(result.error, 409);
    return ok(result, 201);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
