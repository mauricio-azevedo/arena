export type RouteAccess =
  | {
      kind: 'public';
      requiresCheck: false;
    }
  | {
      kind: 'optional-auth';
      requiresCheck: false;
    }
  | {
      kind: 'guest';
      requiresCheck: true;
    }
  | {
      kind: 'auth';
      requiresCheck: true;
      groupId?: string;
      requiredRole?: 'MEMBER' | 'ADMIN';
    };

export type RouteChromePolicy = {
  topBar: boolean;
  bottomNav: boolean;
  trackNavigation: boolean;
};

export type RoutePolicy = {
  access: RouteAccess;
  chrome: RouteChromePolicy;
};

const primaryAppChrome: RouteChromePolicy = {
  topBar: true,
  bottomNav: true,
  trackNavigation: true,
};

const guestChrome: RouteChromePolicy = {
  topBar: true,
  bottomNav: false,
  trackNavigation: false,
};

export function getRoutePolicy(pathname: string): RoutePolicy {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/login' || normalizedPathname === '/register') {
    return {
      access: {
        kind: 'guest',
        requiresCheck: true,
      },
      chrome: guestChrome,
    };
  }

  if (normalizedPathname === '/profile') {
    return {
      access: {
        kind: 'optional-auth',
        requiresCheck: false,
      },
      chrome: primaryAppChrome,
    };
  }

  if (normalizedPathname === '/groups/new') {
    return {
      access: {
        kind: 'auth',
        requiresCheck: true,
      },
      chrome: primaryAppChrome,
    };
  }

  if (normalizedPathname === '/notifications') {
    return {
      access: {
        kind: 'auth',
        requiresCheck: true,
      },
      chrome: primaryAppChrome,
    };
  }

  if (/^\/claim-requests\/[^/]+$/.test(normalizedPathname)) {
    return {
      access: {
        kind: 'auth',
        requiresCheck: true,
      },
      chrome: primaryAppChrome,
    };
  }

  const inviteMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/invite$/);

  if (inviteMatch?.[1]) {
    return {
      access: {
        kind: 'auth',
        requiresCheck: true,
        groupId: inviteMatch[1],
        requiredRole: 'ADMIN',
      },
      chrome: primaryAppChrome,
    };
  }

  const newMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/new$/);

  if (newMatchMatch?.[1]) {
    return {
      access: {
        kind: 'auth',
        requiresCheck: true,
        groupId: newMatchMatch[1],
        requiredRole: 'MEMBER',
      },
      chrome: primaryAppChrome,
    };
  }

  const editMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/([^/]+)\/edit$/);

  if (editMatchMatch?.[1]) {
    return {
      access: {
        kind: 'auth',
        requiresCheck: true,
        groupId: editMatchMatch[1],
        requiredRole: 'MEMBER',
      },
      chrome: primaryAppChrome,
    };
  }

  return {
    access: {
      kind: 'public',
      requiresCheck: false,
    },
    chrome: primaryAppChrome,
  };
}

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}
