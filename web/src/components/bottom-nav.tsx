'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type BottomNavHref = '/' | '/search' | '/profile';

type BottomNavItem = {
  href: BottomNavHref;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const items: BottomNavItem[] = [
  {
    href: '/',
    label: 'Início',
    icon: Home,
    isActive: isHomePath,
  },
  {
    href: '/search',
    label: 'Buscar',
    icon: Search,
    isActive: (pathname) => isExactOrDescendantPath(pathname, '/search'),
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: UserRound,
    isActive: (pathname) => isExactOrDescendantPath(pathname, '/profile'),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeHref = getActiveBottomNavHref(pathname);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center"
    >
      <div className="inline-flex items-center gap-1.5 rounded-pill border border-foreground/8 bg-foreground/6 p-2 shadow-float backdrop-blur-md">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={getBottomNavLinkClassName(isActive)}
            >
              <Icon className="size-[22px]" strokeWidth={1.9} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getActiveBottomNavHref(pathname: string | null): BottomNavHref | null {
  if (!pathname) {
    return null;
  }

  return items.find((item) => item.isActive(pathname))?.href ?? null;
}

function isHomePath(pathname: string) {
  return pathname === '/' || pathname === '/groups' || pathname.startsWith('/groups/');
}

function isExactOrDescendantPath(pathname: string, href: Exclude<BottomNavHref, '/'>) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getBottomNavLinkClassName(isActive: boolean) {
  return cn(
    'relative flex size-14 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    isActive
      ? 'border-white/15 bg-brand text-brand-foreground shadow-button'
      : 'border-transparent text-foreground/50 hover:text-foreground',
  );
}
