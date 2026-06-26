/**
 * POST /api/auth/login — { email, password } → AuthResult ({ token, user }) or 401.
 */
import { z } from 'zod';
import { login } from '@/lib/auth/service';
import { ok, fail, readJson } from '../../_helpers';

export const runtime = 'nodejs';

const BodySchema = z.object({
  email: z.string().min(1, 'email is required'),
  password: z.string().min(1, 'password is required'),
});

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('Invalid request body', 422, parsed.error.flatten());
    const result = login(parsed.data.email, parsed.data.password);
    if (!result) return fail('Invalid email or password', 401);
    return ok(result);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
