/**
 * /api/auth — login / register / me.
 * POST /auth/login    { email, password }            → AuthResult or 401
 * POST /auth/register { name, email, password, role } → AuthResult or 409 (dup email)
 * GET  /auth/me       Authorization: Bearer <token>   → { user } or 401
 */
import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { z } from 'zod';
import { UserRole } from '../lib/domain/types';
import { AuthService } from '../core/auth.service';
import { ok, validate, apiError } from '../common/api';
import { Public } from '../common/public.decorator';

const LoginSchema = z.object({
  email: z.string().min(1, 'email is required'),
  password: z.string().min(1, 'password is required'),
});

const RegisterSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('a valid email is required'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: UserRole,
  seekerId: z.string().optional(),
});

function bearer(header?: string): string | null {
  const match = (header ?? '').match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    const { email, password } = validate(LoginSchema, body);
    const result = this.auth.login(email, password);
    if (!result) apiError('Invalid email or password', HttpStatus.UNAUTHORIZED);
    return ok(result);
  }

  @Post('register')
  @HttpCode(201)
  register(@Body() body: unknown) {
    const input = validate(RegisterSchema, body);
    const result = this.auth.register(input);
    if ('error' in result) apiError(result.error, HttpStatus.CONFLICT);
    return ok(result);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    const token = bearer(authorization);
    const user = token ? this.auth.currentUser(token) : null;
    if (!user) apiError('Not authenticated', HttpStatus.UNAUTHORIZED);
    return ok({ user });
  }
}
