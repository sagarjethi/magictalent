/**
 * AuthService — DI wrapper over the auth lib (login / register / currentUser).
 */
import { Injectable } from '@nestjs/common';
import type { AuthResult, User } from '../lib/domain/types';
import { login, register, currentUser, type RegisterInput } from '../lib/auth/service';

@Injectable()
export class AuthService {
  login(email: string, password: string): AuthResult | null {
    return login(email, password);
  }

  register(input: RegisterInput): AuthResult | { error: string } {
    return register(input);
  }

  currentUser(token: string): User | null {
    return currentUser(token);
  }
}
