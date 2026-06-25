import { isAccessTokenExpired, triggerSessionExpired } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  token?: string;
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  { token, body, headers, ...options }: ApiRequestOptions = {},
): Promise<T> {
  // The token is already dead — don't fire a doomed request, just hand off to the
  // re-login flow.
  if (token && isAccessTokenExpired(token)) {
    triggerSessionExpired();
    throw new Error('Session expired');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // A 401 only means "log back in" when the token itself is expired — covers the
    // narrow race where it lapses between sending and the server checking. A 401 with
    // a still-valid token is a business error (e.g. wrong current password) and must
    // not log the user out.
    if (response.status === 401 && token && isAccessTokenExpired(token)) {
      triggerSessionExpired();
    }

    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

async function getErrorMessage(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (Array.isArray(data?.message)) {
      return data.message.join(', ');
    }
  } catch {
    // Ignore JSON parse error and fall back to default message.
  }

  return `Request failed with status ${response.status}`;
}
