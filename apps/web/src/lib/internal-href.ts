export function isSafeInternalHref(href: unknown): href is string {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}

export function getSafeInternalHref(href: unknown, fallback: string) {
  return isSafeInternalHref(href) ? href : fallback;
}

export function getInternalPathname(href: string) {
  if (!isSafeInternalHref(href)) {
    return null;
  }

  const queryIndex = href.indexOf('?');
  const hashIndex = href.indexOf('#');
  const endIndex = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  return endIndex === undefined ? href : href.slice(0, endIndex);
}
