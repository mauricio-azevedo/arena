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
        router.replace(getSafeRedirectUrl(getRedirectParam()) ?? '/groups');
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
        router.replace('/groups');
      }
    }

    checkAccess();

    return () => {
      isCurrent = false;
    };
  }, [routeAccess, router]);

  const shouldHoldContent = routeAccess.requiresCheck && accessState !== 'allowed';

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-30 pt-[max(1.25rem,env(safe-area-inset-top))] text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-background" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklch,var(--primary)_24%,transparent),transparent_34%),radial-gradient(circle_at_88%_10%,color-mix(in_oklch,var(--accent)_38%,transparent),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(circle_at_50%_100%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_36%)]" />

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
      className="br-liquid-glass br-hairline space-y-4 rounded-[2rem] p-4"
    >
      <span className="sr-only">Carregando página</span>
      <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted/70" />
      <div className="space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted/80" />
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
