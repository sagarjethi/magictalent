/**
 * Shared API helpers — the typed ApiResponse envelope, zod validation, and id/time utils.
 * Controllers return `ok(data)`; failures throw `apiError(...)` which serializes to the
 * SAME { ok:false, error } envelope (see AllExceptionsFilter) so the frontend contract holds.
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import type { z } from 'zod';
import type { ApiOk } from '../lib/domain/types';

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

/** Throw a typed API error. Its HttpException body IS the { ok:false, error } envelope. */
export function apiError(error: string, status: number = HttpStatus.BAD_REQUEST, details?: unknown): never {
  throw new HttpException({ ok: false, error, details }, status);
}

/**
 * Validate input against a zod schema, returning the parsed (OUTPUT) value or throwing a
 * 422 envelope. Generic over the schema itself so zod's output type (defaults applied,
 * ZodEffects unwrapped) is preserved — unlike a `ZodType<T>` parameter which collapses to
 * the input type.
 */
export function validate<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    apiError('Invalid request body', HttpStatus.UNPROCESSABLE_ENTITY, result.error.flatten());
  }
  return result.data;
}

/** Collision-resistant id with a readable prefix (mirrors the Next API routes). */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
