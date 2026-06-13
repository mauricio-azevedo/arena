'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { PageChromeProvider, usePageChrome } from '@/components/page-chrome';
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

type RouteChrome = {
  title: string;
  showBack: boolean;
  backHref: string;
  preferBackHref?: boolean;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPathname = pathname ?? '/';
  const routeAccess = useMemo(() => getRouteAccess(currentPathname), [currentPathname]);
  const routeChrome = useMemo(() => getRouteChrome(currentPathname), [currentPathname]);
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
    <PageChromeProvider key={currentPathname} {...routeChrome}>
      <main className="relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden text-foreground">
        <AppHeader />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-2 [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto w-full max-w-md space-y-6">
            {shouldHoldContent ? <AccessGuardSkeleton /> : children}
          </div>
        </div>

        <BottomNav />
      </main>
    </PageChromeProvider>
  );
}

function AppHeader() {
  const router = useRouter();
  const { title, showBack, backHref, preferBackHref } = usePageChrome();

  function handleBack() {
    if (!showBack) {
      return;
    }

    if (!preferBackHref && canSafelyGoBack()) {
      router.back();
      return;
    }

    router.push(backHref);
  }

  return (
    <header className="sticky top-0 z-40 shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+2rem)] backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_64%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_64%,transparent)]" />

      <div className="relative mx-auto grid h-11 w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        <div className="min-w-0 justify-self-start">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Voltar"
              className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </button>
          )}
        </div>

        <h1 className="max-w-[13rem] truncate text-center text-sm font-semibold tracking-[-0.02em] text-foreground">
          {title}
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

function getRouteChrome(pathname: string): RouteChrome {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return { title: 'Seus grupos', showBack: false, backHref: '/' };
  }

  if (normalizedPathname === '/search') {
    return { title: 'Buscar', showBack: false, backHref: '/' };
  }

  if (normalizedPathname === '/profile') {
    return { title: 'Perfil', showBack: false, backHref: '/' };
  }

  if (normalizedPathname === '/login') {
    return { title: 'Entrar', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/register') {
    return { title: 'Criar conta', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/groups/new') {
    return { title: 'Novo grupo', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/profile/settings') {
    return { title: 'Configurações', showBack: true, backHref: '/profile', preferBackHref: true };
  }

  if (normalizedPathname === '/profile/settings/edit') {
    return { title: 'Editar perfil', showBack: true, backHref: '/profile/settings', preferBackHref: true };
  }

  if (normalizedPathname === '/profile/settings/password') {
    return { title: 'Senha', showBack: true, backHref: '/profile/settings', preferBackHref: true };
  }

  const newMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/new$/);

  if (newMatchMatch?.[1]) {
    return {
      title: 'Nova partida',
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
      title: 'Convidar',
      showBack: true,
      backHref: `/groups/${inviteMatch[1]}`,
      preferBackHref: true,
    };
  }

  const groupMatch = normalizedPathname.match(/^\/groups\/([^/]+)$/);

  if (groupMatch?.[1]) {
    return { title: 'Grupo', showBack: true, backHref: '/', preferBackHref: true };
  }

  const userMatch = normalizedPathname.match(/^\/users\/([^/]+)$/);

  if (userMatch?.[1]) {
    return { title: 'Perfil', showBack: true, backHref: '/', preferBackHref: true };
  }

  return { title: 'Arena', showBack: true, backHref: '/', preferBackHref: true };
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
