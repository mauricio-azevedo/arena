export const ACCESS_TOKEN_STORAGE_KEY = 'beachrank_access_token';

type JwtPayload = {
  sub?: string;
};

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function removeAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getCurrentUserIdFromAccessToken() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  return getUserIdFromAccessToken(token);
}

export function getUserIdFromAccessToken(token: string) {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(window.atob(payload)) as JwtPayload;

    return decoded.sub ?? null;
  } catch {
    return null;
  }
}
