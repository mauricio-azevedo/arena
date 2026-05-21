'use client';

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
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
  const [isRoutePending, setIsRoutePending] = useState(false);

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

  useEffect(() => {
    setIsRoutePending(false);
  }, [currentPathname]);

  useEffect(() => {
    if (!isRoutePending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRoutePending(false);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [isRoutePending]);

  function handleShellClick(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as Element | null)?.closest('a[href]');

    if (!anchor || !isInternalNavigationClick(event, anchor)) {
      return;
    }

    setIsRoutePending(true);
  }

  const shouldHoldContent = routeAccess.requiresCheck && accessState !== 'allowed';

  return (
    <main
      onClickCapture={handleShellClick}
      className="relative min-h-screen overflow-hidden bg-background px-4 pb-28 pt-5 text-foreground"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent)_28%,transparent),transparent_38%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-background via-background/80 to-transparent" />

      {isRoutePending && <RoutePendingIndicator />}

      <div className="mx-auto w-full max-w-md space-y-6">
        {shouldHoldContent ? <AccessGuardSkeleton /> : children}
      </div>
      <BottomNav />
    </main>
  );
}

function RoutePendingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-primary/10"
    >
      <span className="sr-only">Carregando página</span>
      <div className="h-full w-1/2 animate-[route-progress_1s_ease-in-out_infinite] rounded-r-full bg-primary shadow-[0_0_18px_color-mix(in_oklch,var(--primary)_55%,transparent)]" />
    </div>
  );
}

function AccessGuardSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-4 rounded-3xl border bg-card/70 p-4 shadow-[0_14px_45px_rgba(84,54,20,0.08)] backdrop-blur-sm"
    >
      <span className="sr-only">Carregando página</span>
      <div className="h-24 animate-pulse rounded-[1.35rem] bg-muted/70" />
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

function isInternalNavigationClick(event: MouseEvent, anchor: Element) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const href = anchor.getAttribute('href');
  const target = anchor.getAttribute('target');
  const download = anchor.getAttribute('download');

  if (!href || target || download || href.startsWith('#')) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const nextUrl = new URL(href, window.location.href);

  if (nextUrl.origin !== window.location.origin) {
    return false;
  }

  return nextUrl.pathname + nextUrl.search !== window.location.pathname + window.location.search;
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
