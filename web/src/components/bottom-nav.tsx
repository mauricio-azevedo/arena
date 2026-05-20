'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, UserRound, UsersRound } from 'lucide-react';

const items = [
  {
    href: '/',
    label: 'Play',
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4">
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
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
