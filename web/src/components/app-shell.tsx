'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Trophy, UserCircle } from 'lucide-react';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { TypographySmall } from '@/components/ui/typography';

type AppShellProps = {
  children: ReactNode;
  chrome?: AppShellChrome;
};

export type AppShellChrome = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  preferBackHref?: boolean;
};

type ResolvedAppShellChrome = Required<AppShellChrome>;

type RouteAccess =
  | { type: 'public' }
  | { type: 'guest' }
  | { type: 'auth' }
  | { type: 'group'; groupId: string; minRole?: 'ADMIN' | 'MEMBER' };

const defaultChrome: ResolvedAppShellChrome = {
  title: 'Arena',
  showBack: false,
  backHref: '/',
  preferBackHref: false,
};

export function AppShell({ children, chrome }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [shouldHoldContent, setShouldHoldContent] = useState(true);

  const currentPathname = pathname ?? '/';
  const routeAccess = useMemo(() => getRouteAccess(currentPathname), [currentPathname]);
  const routeChrome = useMemo(() => getRouteChrome(currentPathname), [currentPathname]);
  const resolvedChrome = useMemo(() => resolveChrome(routeChrome, chrome), [chrome, routeChrome]);

  useEffect(() => {
    let isActive = true;

    async function enforceAccess() {
      if (routeAccess.type === 'public') {
        if (isActive) setShouldHoldContent(false);
        return;
      }

      const token = getAccessToken();
      const redirect = getSafeRedirectUrl(`${currentPathname}${getSearchSuffix(searchParams)}`);

      if (routeAccess.type === 'guest') {
        if (token) {
          router.replace('/');
          return;
        }

        if (isActive) setShouldHoldContent(false);
        return;
      }

      if (!token) {
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      if (routeAccess.type === 'auth') {
        if (isActive) setShouldHoldContent(false);
        return;
      }

      try {
        const groups = await getMyGroups(token);
        const membership = groups.find((group) => group.groupId === routeAccess.groupId);
        const isMember = Boolean(membership);
        const isAdmin = membership?.role === 'ADMIN';
        const hasAccess =
          routeAccess.minRole === 'ADMIN'
            ? isAdmin
            : routeAccess.minRole === 'MEMBER'
              ? isMember
              : isMember;

        if (!hasAccess) {
          router.replace(`/groups/${routeAccess.groupId}`);
          return;
        }

        if (isActive) setShouldHoldContent(false);
      } catch {
        router.replace(`/groups/${routeAccess.groupId}`);
      }
    }

    setShouldHoldContent(true);
    enforceAccess();

    return () => {
      isActive = false;
    };
  }, [currentPathname, routeAccess, router, searchParams]);

  return (
    <main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden text-foreground">
      <div className="absolute inset-0 z-10 overflow-y-auto overscroll-contain px-4 pt-[calc(max(0.75rem,env(safe-area-inset-top))+4.25rem)] pb-[calc(max(1rem,env(safe-area-inset-bottom))+5.5rem)]">
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
      <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-xs" />

      <div className="relative mx-auto grid h-11 w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        <div className="min-w-0 justify-self-start">
          {chrome.showBack && (
            <Button type="button" onClick={handleBack} variant="secondary" size="icon" aria-label="Voltar">
              <ArrowLeft />
            </Button>
          )}
        </div>

        <TypographySmall>{chrome.title}</TypographySmall>

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
      className="space-y-4 rounded-[2rem] bg-card p-4"
    >
      <span className="sr-only">Carregando conteúdo</span>
      <div className="h-8 w-2/3 animate-pulse rounded-full bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted/70" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted/60" />
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const currentPathname = pathname ?? '/';

  const items = [
    { href: '/', label: 'Grupos', icon: Trophy, match: (path: string) => path === '/' || path.startsWith('/groups') },
    { href: '/search', label: 'Buscar', icon: Search, match: (path: string) => path.startsWith('/search') },
    { href: '/profile', label: 'Perfil', icon: UserCircle, match: (path: string) => path.startsWith('/profile') },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-xs" />

      <div className="br-liquid-glass br-hairline relative mx-auto grid h-16 w-full max-w-md grid-cols-3 rounded-[2rem] p-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(currentPathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`br-pressable flex flex-col items-center justify-center rounded-[1.5rem] text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-foreground text-background shadow-[0_14px_30px_color-mix(in_oklch,var(--foreground)_16%,transparent)]'
                  : 'text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10'
              }`}
            >
              <Icon className="mb-0.5 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getRouteAccess(pathname: string): RouteAccess {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/login' || normalizedPathname === '/register') {
    return { type: 'guest' };
  }

  if (normalizedPathname === '/profile' || normalizedPathname === '/groups/new') {
    return { type: 'auth' };
  }

  const inviteMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/invite$/);

  if (inviteMatch) {
    return { type: 'group', groupId: inviteMatch[1], minRole: 'ADMIN' };
  }

  const newMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/new$/);

  if (newMatchMatch) {
    return { type: 'group', groupId: newMatchMatch[1], minRole: 'MEMBER' };
  }

  const editMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/([^/]+)\/edit$/);

  if (editMatchMatch) {
    return { type: 'group', groupId: editMatchMatch[1], minRole: 'MEMBER' };
  }

  return { type: 'public' };
}

function getRouteChrome(pathname: string): ResolvedAppShellChrome {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return { ...defaultChrome, title: 'Seus grupos' };
  }

  if (normalizedPathname === '/search') {
    return { ...defaultChrome, title: 'Buscar' };
  }

  if (normalizedPathname === '/profile') {
    return { ...defaultChrome, title: 'Perfil' };
  }

  if (normalizedPathname === '/login') {
    return { ...defaultChrome, title: 'Entrar', showBack: true, backHref: '/', preferBackHref: true };
  }

  if (normalizedPathname === '/register') {
    return { ...defaultChrome, title: 'Criar conta', showBack: true, backHref: '/' };
  }

  if (normalizedPathname === '/groups/new') {
    return { ...defaultChrome, title: 'Criar grupo', showBack: true, backHref: '/' };
  }

  if (normalizedPathname === '/profile/settings') {
    return { ...defaultChrome, title: 'Configurações', showBack: true, backHref: '/profile' };
  }

  if (normalizedPathname === '/profile/settings/profile') {
    return { ...defaultChrome, title: 'Alterar perfil', showBack: true, backHref: '/profile/settings' };
  }

  if (normalizedPathname === '/profile/settings/password') {
    return { ...defaultChrome, title: 'Alterar senha', showBack: true, backHref: '/profile/settings' };
  }

  const newMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/new$/);

  if (newMatchMatch) {
    return {
      ...defaultChrome,
      title: 'Registrar partida',
      showBack: true,
      backHref: `/groups/${newMatchMatch[1]}`,
    };
  }

  const editMatchMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/matches\/([^/]+)\/edit$/);

  if (editMatchMatch) {
    return {
      ...defaultChrome,
      title: 'Corrigir partida',
      showBack: true,
      backHref: `/groups/${editMatchMatch[1]}`,
    };
  }

  const inviteMatch = normalizedPathname.match(/^\/groups\/([^/]+)\/invite$/);

  if (inviteMatch) {
    return {
      ...defaultChrome,
      title: 'Convidar pessoas',
      showBack: true,
      backHref: `/groups/${inviteMatch[1]}`,
    };
  }

  const groupMatch = normalizedPathname.match(/^\/groups\/([^/]+)$/);

  if (groupMatch) {
    return { ...defaultChrome, title: '', showBack: true, backHref: '/' };
  }

  const userProfileMatch = normalizedPathname.match(/^\/users\/([^/]+)$/);

  if (userProfileMatch) {
    return { ...defaultChrome, title: 'Perfil', showBack: true, backHref: '/' };
  }

  return { ...defaultChrome };
}

function resolveChrome(routeChrome: ResolvedAppShellChrome, chrome?: AppShellChrome): ResolvedAppShellChrome {
  return {
    title: chrome?.title ?? routeChrome.title,
    showBack: chrome?.showBack ?? routeChrome.showBack,
    backHref: chrome?.backHref ?? routeChrome.backHref,
    preferBackHref: chrome?.preferBackHref ?? routeChrome.preferBackHref,
  };
}

function canSafelyGoBack() {
  return typeof window !== 'undefined' && window.history.length > 1;
}

function getSearchSuffix(searchParams: ReturnType<typeof useSearchParams>) {
  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

function getSafeRedirectUrl(url: string) {
  return url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

function normalizePathname(pathname: string) {
  if (pathname.length <= 1) {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}
