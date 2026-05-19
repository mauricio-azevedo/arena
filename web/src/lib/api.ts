import type {
  AuthResponse,
  CreateMatchInput,
  Group,
  GroupInvite,
  GroupMember,
  Match,
  MyGroup,
  Player,
  UpdateMatchInput,
  User,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Auth
 */

export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  return parseResponse<User>(response, 'Failed to fetch current user');
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseResponse<AuthResponse>(response, 'Failed to login');
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseResponse<AuthResponse>(response, 'Failed to register');
}

/**
 * Groups
 */

export async function getGroups(): Promise<Group[]> {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    cache: 'no-store',
  });

  return parseResponse<Group[]>(response, 'Failed to fetch groups');
}

export async function getMyGroups(token: string): Promise<MyGroup[]> {
  const response = await fetch(`${API_BASE_URL}/me/groups`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  return parseResponse<MyGroup[]>(response, 'Failed to fetch my groups');
}

export async function createGroup(
  token: string,
  input: {
    name: string;
    description?: string;
  },
): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(input),
  });

  return parseResponse<Group>(response, 'Failed to create group');
}

export async function getGroup(groupId: string): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
    cache: 'no-store',
  });

  return parseResponse<Group>(response, 'Failed to fetch group');
}

export async function getGroupRanking(groupId: string): Promise<GroupMember[]> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/ranking`, {
    cache: 'no-store',
  });

  return parseResponse<GroupMember[]>(response, 'Failed to fetch group ranking');
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/players`, {
    cache: 'no-store',
  });

  return parseResponse<GroupMember[]>(response, 'Failed to fetch group members');
}

export async function getGroupMatches(groupId: string): Promise<Match[]> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/matches`, {
    cache: 'no-store',
  });

  return parseResponse<Match[]>(response, 'Failed to fetch group matches');
}

export async function createGroupInvite(token: string, groupId: string): Promise<GroupInvite> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invites`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<GroupInvite>(response, 'Failed to create group invite');
}

/**
 * Legacy API
 * Mantido temporariamente até migrarmos as telas antigas para grupos.
 */

export async function getRanking(): Promise<Player[]> {
  const response = await fetch(`${API_BASE_URL}/ranking`, {
    cache: 'no-store',
  });

  return parseResponse<Player[]>(response, 'Failed to fetch ranking');
}

export async function createPlayer(name: string): Promise<Player> {
  const response = await fetch(`${API_BASE_URL}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  return parseResponse<Player>(response, 'Failed to create player');
}

export async function createMatch(input: CreateMatchInput): Promise<Match> {
  const response = await fetch(`${API_BASE_URL}/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseResponse<Match>(response, 'Failed to create match');
}

export async function getMatches(): Promise<Match[]> {
  const response = await fetch(`${API_BASE_URL}/matches`, {
    cache: 'no-store',
  });

  return parseResponse<Match[]>(response, 'Failed to fetch matches');
}

export async function updateMatch(id: string, input: UpdateMatchInput): Promise<Match> {
  const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseResponse<Match>(response, 'Failed to update match');
}

export async function deleteMatch(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
    method: 'DELETE',
  });

  return parseResponse<{ success: boolean }>(response, 'Failed to delete match');
}
