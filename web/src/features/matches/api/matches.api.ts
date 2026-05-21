import { apiRequest } from '@/lib/api-client';
import type { CreateMatchInput, Match } from '@/types/api';

export function getGroupMatches(groupId: string): Promise<Match[]> {
  return apiRequest<Match[]>(`/groups/${groupId}/matches`, {
    cache: 'no-store',
  });
}

export function getGroupMatch(groupId: string, matchId: string): Promise<Match> {
  return apiRequest<Match>(`/groups/${groupId}/matches/${matchId}`, {
    cache: 'no-store',
  });
}

export function createGroupMatch(
  token: string,
  groupId: string,
  input: CreateMatchInput,
): Promise<Match> {
  return apiRequest<Match>(`/groups/${groupId}/matches`, {
    method: 'POST',
    token,
    body: input,
  });
}

export function updateGroupMatch(
  token: string,
  groupId: string,
  matchId: string,
  input: CreateMatchInput,
): Promise<Match> {
  return apiRequest<Match>(`/groups/${groupId}/matches/${matchId}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function deleteGroupMatch(
  token: string,
  groupId: string,
  matchId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/groups/${groupId}/matches/${matchId}`, {
    method: 'DELETE',
    token,
  });
}
