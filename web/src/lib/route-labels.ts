export function getDestinationLabel(href: string) {
  const pathname = getPathname(href);

  if (pathname === '/') {
    return 'Início';
  }

  if (pathname === '/search') {
    return 'Buscar';
  }

  if (pathname === '/groups') {
    return 'Grupos';
  }

  if (pathname === '/profile') {
    return 'Perfil';
  }

  if (pathname === '/profile/settings' || pathname.startsWith('/profile/settings/')) {
    return 'Configurações';
  }

  if (pathname.startsWith('/groups/')) {
    return 'Grupo';
  }

  if (pathname.startsWith('/users/')) {
    return 'Perfil';
  }

  return 'Anterior';
}

export function getReturnAwareHref(href: string, returnTo: string) {
  const safeReturnTo = getSafeInternalHref(returnTo);

  if (!safeReturnTo) {
    return href;
  }

  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function getSafeInternalHref(href: string | undefined, fallback = '/') {
  if (!href || !href.startsWith('/') || href.startsWith('//')) {
    return fallback;
  }

  return href;
}

export function getPathWithSearch(pathname: string | null, searchParams: URLSearchParams) {
  const currentPathname = pathname || '/';
  const search = searchParams.toString();

  return `${currentPathname}${search ? `?${search}` : ''}`;
}

function getPathname(href: string) {
  const withoutHash = href.split('#')[0] ?? href;
  const pathname = withoutHash.split('?')[0] || '/';

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}
