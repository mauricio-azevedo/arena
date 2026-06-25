import { getInternalPathname, getSafeInternalHref } from '@/lib/internal-href';

const DEFAULT_AUTH_REDIRECT = '/';

export function getSafeAuthRedirectPath(redirect: unknown, fallback = DEFAULT_AUTH_REDIRECT) {
  const safeFallback = getSafeAuthRedirectFallback(fallback);
  const safeRedirect = getSafeInternalHref(redirect, safeFallback);
  const pathname = getInternalPathname(safeRedirect);

  if (!pathname || isAuthPathname(pathname)) {
    return safeFallback;
  }

  return safeRedirect;
}

function getSafeAuthRedirectFallback(fallback: unknown) {
  const safeFallback = getSafeInternalHref(fallback, DEFAULT_AUTH_REDIRECT);
  const fallbackPathname = getInternalPathname(safeFallback);

  if (!fallbackPathname || isAuthPathname(fallbackPathname)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return safeFallback;
}

// The /login and /register paths are thin shims that just open the auth sheet, so a
// post-auth redirect must never resolve to one (it would re-open the sheet).
function isAuthPathname(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}
