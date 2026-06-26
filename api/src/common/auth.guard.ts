/**
 * Global authentication guard. Every route requires a valid Bearer JWT unless the handler
 * or its controller is marked @Public(). On success the resolved User is attached to
 * request.user; on failure it throws the same { ok:false, error:'Not authenticated' }
 * 401 envelope the rest of the API uses (via UnauthorizedException + AllExceptionsFilter).
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { User } from '../lib/domain/types';
import { currentUser } from '../lib/auth/service';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface AuthedRequest extends Request {
  user?: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = bearer(request.headers.authorization);
    const user = token ? currentUser(token) : null;
    if (!user) {
      throw new UnauthorizedException({ ok: false, error: 'Not authenticated' });
    }
    request.user = user;
    return true;
  }
}

function bearer(header?: string): string | null {
  const match = (header ?? '').match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
