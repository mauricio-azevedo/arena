import { getInternalPathname, getSafeInternalHref } from '@/lib/internal-href';

export type AuthRoute = '/login' | '/register';

const DEFAULT_AUTH_REDIRECT = '/';
const authPathnames = new Set<AuthRoute>(['/login', '/register']);

export function getSafeAuthRedirectPath(
  redirect: unknown,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  const safeFallback = getSafeAuthRedirectFallback(fallback);
  const safeRedirect = getSafeInternalHref(redirect, safeFallback);
  const pathname = getInternalPathname(safeRedirect);

  if (!pathname || authPathnames.has(pathname as AuthRoute)) {
    return safeFallback;
  }

  return safeRedirect;
}

export function buildAuthHref(
  route: AuthRoute,
  redirect: unknown,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  const safeRedirect = getSafeAuthRedirectPath(redirect, fallback);

  return `${route}?redirect=${encodeURIComponent(safeRedirect)}`;
}

function getSafeAuthRedirectFallback(fallback: unknown) {
  const safeFallback = getSafeInternalHref(fallback, DEFAULT_AUTH_REDIRECT);
  const fallbackPathname = getInternalPathname(safeFallback);

  if (!fallbackPathname || authPathnames.has(fallbackPathname as AuthRoute)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return safeFallback;
}
