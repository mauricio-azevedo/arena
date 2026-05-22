import { apiRequest } from '@/lib/api-client';

export type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type UpdatePasswordResponse = {
  success: true;
};

export function updatePassword(
  token: string,
  input: UpdatePasswordInput,
): Promise<UpdatePasswordResponse> {
  return apiRequest<UpdatePasswordResponse>('/me/password', {
    method: 'PATCH',
    token,
    body: input,
  });
}
