'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getAccessToken } from '@/lib/auth';

export type AppShellChrome = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  preferBackHref?: boolean;
};

type ResolvedAppShellChrome = Required<AppShellChrome>;

type AppShellProps = {
  children: ReactNode;
  chrome?: AppShellChrome;
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

export function AppShell({ children, chrome }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPathname = pathname ?? '/';
  const routeAccess = useMemo(() => getRouteAccess(currentPathname), [currentPathname]);
  const routeChrome = useMemo(() => getRouteChrome(currentPathname), [currentPathname]);
  const resolvedChrome = useMemo(
    () => resolveChrome(routeChrome, chrome),
    [chrome, routeChrome],
  );
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
    <main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden text-foreground">
      <div className="absolute inset-0 z-10 overflow-y-auto overscroll-contain px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(4.75rem+env(safe-area-inset-top))] [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto w-full max-w-md space-y-6">
          {shouldHoldContent ? <AccessGuardSkeleton /> : children}
        </div>
      </div>

      <AppHeader chrome={resolvedChrome} />
      <BottomNav />
    </main>
  );
}

function AppHeader({ chrome }: { chrome: ResolvedAppShellChrome }) {
  const router = useRouter();

  function handleBack() {
    if (!chrome.showBack) {
      return;
    }

    if (!chrome.preferBackHref && canSafelyGoBack()) {
      router.back();
      return;
    }

    router.push(chrome.backHref);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 bg-card/[0.08] backdrop-blur-2xl" />

      <div className="relative mx-auto grid h-11 w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        <div className="min-w-0 justify-self-start">
          {chrome.showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Voltar"
              className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        <h1 className="max-w-[13rem] truncate text-center text-sm font-semibold tracking-[-0.02em] text-foreground">
          {chrome.title}
        </h1>

        <div aria-hidden="true" />
      </div>
    </header>
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

function getRouteChrome(pathname: string): ResolvedAppShellChrome {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return { title: 'Seus grupos', showBack: false, backHref: '/', preferBackHref: false };
  }

  if (normalizedPathname === '/search') {
    return { title: 'Buscar', showBack: false, backHref: '/', preferBackHref: false };
  }

  if (normalizedPathname === '/profile') {
    return { title: 'Perfil', showBack: false, backHref: '/', preferBackHref: false };
  }

  if (normalizedPathname === '/login') {
    return { title: 'Entrar', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/register') {
    return { title: 'Criar conta', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/groups/new') {
    return { title: 'Criar grupo', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/profile/settings') {
    return { title: 'Configurações', showBack: true, backHref: '/profile', preferBackHref: true };
  }

  if (normalizedPathname === '/profile/settings/profile') {
    return { title: 'Alterar perfil', showBack: true, backHref: '/profile/settings', preferBackHref: true };
  }

  if (normalizedPathname === '/profile/settings/password') {
    return { title: 'Alterar senha', showBack: true, backHref: '/profile/settings', preferBackHref: true };
  }

  const newMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/new$/);

  if (newMatchMatch?.[1]) {
    return {
      title: 'Registrar partida',
      showBack: true,
      backHref: `/groups/${newMatchMatch[1]}`,
      preferBackHref: true,
    };
  }

  const editMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/([^/]+)\/edit$/);

  if (editMatchMatch?.[1]) {
    return {
      title: 'Corrigir partida',
      showBack: true,
      backHref: `/groups/${editMatchMatch[1]}`,
      preferBackHref: true,
    };
  }

  const inviteMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/invite$/);

  if (inviteMatch?.[1]) {
    return {
      title: 'Convidar pessoas',
      showBack: true,
      backHref: `/groups/${inviteMatch[1]}`,
      preferBackHref: true,
    };
  }

  const groupMatch = normalizedPathname.match(/^\/groups\/([^/]+)$/);

  if (groupMatch?.[1]) {
    return { title: '', showBack: true, backHref: '/', preferBackHref: true };
  }

  const userMatch = normalizedPathname.match(/^\/users\/([^/]+)$/);

  if (userMatch?.[1]) {
    return { title: 'Perfil', showBack: true, backHref: '/', preferBackHref: true };
  }

  return { title: 'Arena', showBack: true, backHref: '/', preferBackHref: true };
}

function resolveChrome(
  routeChrome: ResolvedAppShellChrome,
  chrome?: AppShellChrome,
): ResolvedAppShellChrome {
  return {
    title: chrome?.title ?? routeChrome.title,
    showBack: chrome?.showBack ?? routeChrome.showBack,
    backHref: chrome?.backHref ?? routeChrome.backHref,
    preferBackHref: chrome?.preferBackHref ?? routeChrome.preferBackHref,
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

function canSafelyGoBack() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.history.length <= 1 || !document.referrer) {
    return false;
  }

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}
