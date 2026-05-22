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

function getPathname(href: string) {
  const withoutHash = href.split('#')[0] ?? href;
  const pathname = withoutHash.split('?')[0] || '/';

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}
