'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, UserRound } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const items = [
  {
    href: '/',
    label: 'Início',
    icon: Home,
  },
  {
    href: '/search',
    label: 'Buscar',
    icon: Search,
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: UserRound,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeValue = items.find((item) => isActivePath(pathname, item.href))?.href ?? '/';

  return (
    <nav className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 justify-center flex">
      <Tabs value={activeValue}>
        <TabsList>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeValue === item.href;

            return (
              <TabsTrigger key={item.href} value={item.href} asChild>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </nav>
  );
}

function isActivePath(pathname: string | null, href: string) {
  if (href === '/') {
    return pathname === '/' || Boolean(pathname?.startsWith('/groups/'));
  }

  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}
