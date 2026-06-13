'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getAccessToken } from '@/lib/auth';

type AppShellProps = {
  children: ReactNode;
};

type AccessState = 'checking' | 'allowed' | 'redirecting';

type RouteAccess =
  | {
      kind: 'public';
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

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPathname = pathname ?? '/';
  const routeAccess = useMemo(() => getRouteAccess(currentPathname), [currentPathname]);
  const [accessState, setAccessState] = useState<AccessState>(
    routeAccess.requiresCheck ? 'checking' : 'allowed',
  );

  useEffect(() => {
    let isCurrent = true;

    async function checkAccess() {
      if (!routeAccess.requiresCheck) {
        setAccessState('allowed');
        return;
      }

      setAccessState('checking');

      const token = getAccessToken();

      if (routeAccess.kind === 'guest') {
        if (!token) {
          setAccessState('allowed');
          return;
        }

        setAccessState('redirecting');
        router.replace(getSafeRedirectUrl(getRedirectParam()) ?? '/');
        return;
      }

      if (!token) {
        setAccessState('redirecting');
        router.replace(`/login?redirect=${encodeURIComponent(getCurrentPathWithSearch())}`);
        return;
      }

      if (!routeAccess.groupId) {
        setAccessState('allowed');
        return;
      }

      try {
        const memberships = await getMyGroups(token);

        if (!isCurrent) {
          return;
        }

        const membership = memberships.find((item) => item.groupId === routeAccess.groupId);

        if (!membership) {
          setAccessState('redirecting');
          router.replace(`/groups/${routeAccess.groupId}`);
          return;
        }

        if (routeAccess.requiredRole === 'ADMIN' && membership.role !== 'ADMIN') {
          setAccessState('redirecting');
          router.replace(`/groups/${routeAccess.groupId}`);
          return;
        }

        setAccessState('allowed');
      } catch {
        if (!isCurrent) {
          return;
        }

        setAccessState('redirecting');
        router.replace('/');
      }
    }

    checkAccess();

    return () => {
      isCurrent = false;
    };
  }, [routeAccess, router]);

  const shouldHoldContent = routeAccess.requiresCheck && accessState !== 'allowed';

  return (
    <main className="min-h-screen px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] text-foreground">
      <div className="mx-auto w-full max-w-md space-y-6">
        {shouldHoldContent ? <AccessGuardSkeleton /> : children}
      </div>
      <BottomNav />
    </main>
  );
}

function AccessGuardSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-4 rounded-[2rem] bg-card p-4 shadow-[0_10px_30px_color-mix(in_oklch,var(--foreground)_5%,transparent)]"
    >
      <span className="sr-only">Carregando página</span>
      <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function getRouteAccess(pathname: string): RouteAccess {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/login' || normalizedPathname === '/register') {
    return {
      kind: 'guest',
      requiresCheck: true,
    };
  }

  if (normalizedPathname === '/profile') {
    return {
      kind: 'auth',
      requiresCheck: true,
    };
  }

  if (normalizedPathname === '/groups/new') {
    return {
      kind: 'auth',
      requiresCheck: true,
    };
  }

  const inviteMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/invite$/);

  if (inviteMatch?.[1]) {
    return {
      kind: 'auth',
      requiresCheck: true,
      groupId: inviteMatch[1],
      requiredRole: 'ADMIN',
    };
  }

  const newMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/new$/);

  if (newMatchMatch?.[1]) {
    return {
      kind: 'auth',
      requiresCheck: true,
      groupId: newMatchMatch[1],
      requiredRole: 'MEMBER',
    };
  }

  const editMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/([^/]+)\/edit$/);

  if (editMatchMatch?.[1]) {
    return {
      kind: 'auth',
      requiresCheck: true,
      groupId: editMatchMatch[1],
      requiredRole: 'MEMBER',
    };
  }

  return {
    kind: 'public',
    requiresCheck: false,
  };
}

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getCurrentPathWithSearch() {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}`;
}

function getRedirectParam() {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get('redirect');
}

function getSafeRedirectUrl(redirect: string | null) {
  if (!redirect) {
    return null;
  }

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return null;
  }

  const pathname = redirect.split('?')[0] ?? redirect;

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return redirect;
}
