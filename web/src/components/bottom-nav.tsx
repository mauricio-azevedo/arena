'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, UserRound, UsersRound } from 'lucide-react';
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
    href: '/groups',
    label: 'Grupos',
    icon: UsersRound,
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
    <nav className="fixed inset-x-0 bottom-3 z-50 px-4">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 rounded-[2rem] border bg-card/85 p-1.5 shadow-[0_18px_60px_rgba(94,58,22,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/75">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-[1.45rem] text-[11px] font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
