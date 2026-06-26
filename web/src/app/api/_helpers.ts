/**
 * Shared API helpers — typed ApiResponse envelopes, id generation, and safe JSON parsing.
 * (Underscore-prefixed: not a route.)
 */
import { NextResponse } from 'next/server';
import type { ApiResponse, User } from '@/lib/domain/types';
import { currentUser } from '@/lib/auth/service';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { status });
}

export function fail(error: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error, details }, { status });
}

/** Marker error thrown by requireUser — distinguished in handleError so genuine 500s aren't masked. */
export class AuthError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthError';
  }
}

function bearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Require a valid Bearer JWT. Returns the authenticated User or throws AuthError (→ 401). */
export function requireUser(req: Request): User {
  const token = bearer(req);
  const user = token ? currentUser(token) : null;
  if (!user) throw new AuthError();
  return user;
}

/** Map a caught error to the right ApiResponse: AuthError → 401, everything else → 500. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof AuthError) return fail(e.message, 401);
  return fail((e as Error).message, 500);
}

/** Parse a request body as JSON, returning {} on empty/invalid bodies (never throws). */
export async function readJson(req: Request): Promise<unknown> {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/** Collision-resistant id with a readable prefix. */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
