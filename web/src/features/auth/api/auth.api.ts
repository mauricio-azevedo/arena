import { apiRequest } from '@/lib/api-client';
import type { AuthResponse, User } from '@/types/api';

export function getMe(token: string): Promise<User> {
  return apiRequest<User>('/auth/me', {
    token,
    cache: 'no-store',
  });
}

export function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  nickname?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
}
