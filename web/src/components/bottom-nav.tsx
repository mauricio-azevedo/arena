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
    <nav className="fixed inset-x-0 bottom-[max(0.85rem,env(safe-area-inset-bottom))] z-50 px-4">
      <div className="br-liquid-glass br-hairline mx-auto grid h-[4.35rem] max-w-md grid-cols-3 rounded-[2.2rem] p-1.5">
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
                'br-pressable relative flex flex-col items-center justify-center gap-1 rounded-[1.75rem] text-[11px] font-semibold transition-all',
                isActive
                  ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_20%,transparent)]'
                  : 'text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10',
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
