import type { Account, AuthSession, LoginBody, RegisterInput } from '@arena/contracts/auth';
import { apiRequest } from '@/lib/api-client';

export function getMe(token: string): Promise<Account> {
  return apiRequest<Account>('/auth/me', {
    token,
    cache: 'no-store',
  });
}

export function login(input: LoginBody): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/register', {
    method: 'POST',
    body: input,
  });
}
