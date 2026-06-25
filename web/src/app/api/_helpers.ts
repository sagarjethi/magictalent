/**
 * Shared API helpers — typed ApiResponse envelopes, id generation, and safe JSON parsing.
 * (Underscore-prefixed: not a route.)
 */
import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/domain/types';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { status });
}

export function fail(error: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error, details }, { status });
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
