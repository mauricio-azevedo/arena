'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <nav className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 px-4">
      <div className="mx-auto grid h-16 max-w-md grid-cols-3 p-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/' || Boolean(pathname?.startsWith('/groups/'))
              : pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn('flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-medium')}
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
