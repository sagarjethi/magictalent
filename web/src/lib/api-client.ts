/**
 * api-client — a tiny typed fetch wrapper for client components.
 *
 * Every API route returns `ApiResponse<T>` = { ok:true, data:T } | { ok:false, error }.
 * `apiGet` / `apiPost` / `apiPatch` unwrap that envelope and throw a friendly Error on
 * failure, so callers can `try/catch` and render an Alert without re-checking `ok`.
 *
 * (Server components read the repo/services directly — this is only for the browser.)
 */
import type { ApiResponse } from '@/lib/domain/types';

/** Demo identities — no auth in the MVP. Picked from the deterministic seed. */
export const CURRENT_SEEKER_ID = 'seeker-5'; // Sofia Rossi — has seeded applications
export const CURRENT_SEEKER_NAME = 'Sofia Rossi';
export const CURRENT_RECRUITER_ID = 'recruiter-demo';

/**
 * Backend base URL. When `NEXT_PUBLIC_API_BASE` is set (e.g. the NestJS service at
 * http://localhost:4000), requests target it; otherwise they fall back to the Next.js
 * route handlers (relative paths) so the app works standalone. Paths are passed as
 * `/api/...` and align with the NestJS global prefix `/api`.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
function resolveUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

async function unwrap<T>(res: Response): Promise<T> {
  let payload: ApiResponse<T> | undefined;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`The server returned an unreadable response (HTTP ${res.status}).`);
  }
  if (!payload || typeof payload !== 'object' || !('ok' in payload)) {
    throw new Error('The server returned an unexpected response shape.');
  }
  if (!payload.ok) {
    throw new Error(payload.error || 'Something went wrong. Please try again.');
  }
  return payload.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(resolveUrl(path), { headers: { accept: 'application/json' }, cache: 'no-store' });
  return unwrap<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(resolveUrl(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return unwrap<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(resolveUrl(path), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return unwrap<T>(res);
}
