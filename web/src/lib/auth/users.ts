/**
 * In-memory user store singleton. Holds password hashes server-side; never exposed.
 * Seeded with two deterministic demo accounts so login works out of the box.
 */
import { randomUUID } from 'node:crypto';
import type { User, UserRole } from '@/lib/domain/types';
import { hashPassword } from '@/lib/auth/password';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  seekerId?: string;
  createdAt: string;
  passwordHash: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  seekerId?: string;
}

const SEED_CREATED_AT = '2024-01-01T00:00:00.000Z';

class UserStore {
  private byId = new Map<string, UserRecord>();
  private byEmail = new Map<string, UserRecord>();

  constructor() {
    this.seed({ id: 'user-recruiter', name: 'Riya Mehta', email: 'recruiter@jobmagic.dev', password: 'demo1234', role: 'recruiter' });
    this.seed({ id: 'user-sofia', name: 'Sofia Rossi', email: 'sofia@jobmagic.dev', password: 'demo1234', role: 'seeker', seekerId: 'seeker-5' });
  }

  private seed(input: CreateUserInput & { id: string }): void {
    const record: UserRecord = {
      id: input.id,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      seekerId: input.seekerId,
      createdAt: SEED_CREATED_AT,
      passwordHash: hashPassword(input.password),
    };
    this.byId.set(record.id, record);
    this.byEmail.set(record.email, record);
  }

  findByEmail(email: string): UserRecord | undefined {
    return this.byEmail.get(email.toLowerCase());
  }

  findById(id: string): UserRecord | undefined {
    return this.byId.get(id);
  }

  /** Create a new user, hashing the password. Returns null if the email is already taken. */
  create(input: CreateUserInput): UserRecord | null {
    const email = input.email.toLowerCase();
    if (this.byEmail.has(email)) return null;
    const record: UserRecord = {
      id: `user_${randomUUID()}`,
      name: input.name,
      email,
      role: input.role,
      seekerId: input.seekerId,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(input.password),
    };
    this.byId.set(record.id, record);
    this.byEmail.set(record.email, record);
    return record;
  }

  /** Strip the password hash → the public User shape safe to return to clients. */
  toPublicUser(record: UserRecord): User {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      seekerId: record.seekerId,
      createdAt: record.createdAt,
    };
  }
}

let store: UserStore | undefined;

export function getUserStore(): UserStore {
  if (!store) store = new UserStore();
  return store;
}
