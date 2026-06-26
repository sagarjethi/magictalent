/**
 * Auth service — login / register / currentUser over the user store + JWT.
 * Token payload is { sub: user.id, role }.
 */
import type { AuthResult, User, UserRole } from '@/lib/domain/types';
import { signJwt, verifyJwt } from '@/lib/auth/jwt';
import { getUserStore, type CreateUserInput } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';

function issue(user: User): AuthResult {
  return { token: signJwt({ sub: user.id, role: user.role }), user };
}

export function login(email: string, password: string): AuthResult | null {
  const store = getUserStore();
  const record = store.findByEmail(email);
  if (!record || !verifyPassword(password, record.passwordHash)) return null;
  return issue(store.toPublicUser(record));
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  seekerId?: string;
}

export function register(input: RegisterInput): AuthResult | { error: string } {
  const store = getUserStore();
  const created = store.create(input as CreateUserInput);
  if (!created) return { error: 'An account with that email already exists' };
  return issue(store.toPublicUser(created));
}

export function currentUser(token: string): User | null {
  const payload = verifyJwt(token);
  if (!payload) return null;
  const store = getUserStore();
  const record = store.findById(payload.sub);
  return record ? store.toPublicUser(record) : null;
}
