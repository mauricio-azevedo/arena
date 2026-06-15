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
      className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex justify-center"
    >
      <div className="inline-flex w-fit items-center justify-center rounded-full border-1 border-border bg-muted p-1 text-muted-foreground backdrop-blur">
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
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
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
    "relative inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    isActive &&
      'bg-background text-foreground dark:border-input dark:bg-input/30 dark:text-foreground',
  );
}
