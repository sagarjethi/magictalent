/**
 * Global exception filter — guarantees EVERY error response is the { ok:false, error }
 * ApiResponse envelope (never Nest's default error shape), so the frontend contract is
 * identical to the Next.js /api routes. Already-enveloped HttpExceptions pass through.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErr } from '../lib/domain/types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErr = { ok: false, error: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (isEnvelope(response)) {
        body = response;
      } else if (typeof response === 'string') {
        body = { ok: false, error: response };
      } else if (isMessageObject(response)) {
        body = { ok: false, error: normalizeMessage(response.message) };
      }
    } else if (exception instanceof Error) {
      body = { ok: false, error: exception.message };
    }

    res.status(status).json(body);
  }
}

function isEnvelope(value: unknown): value is ApiErr {
  return typeof value === 'object' && value !== null && (value as { ok?: unknown }).ok === false;
}

function isMessageObject(value: unknown): value is { message: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function normalizeMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' ? message : 'Request failed';
}
