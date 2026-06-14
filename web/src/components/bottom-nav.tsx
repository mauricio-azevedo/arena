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
      <div className="mx-auto grid h-16 max-w-md grid-cols-3 rounded-[2rem] bg-card/[0.12] p-1 shadow-[0_10px_30px_color-mix(in_oklch,var(--foreground)_5%,transparent)] backdrop-blur-2xl">
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
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-1 rounded-full text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-card/20 hover:text-foreground',
              )}
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
