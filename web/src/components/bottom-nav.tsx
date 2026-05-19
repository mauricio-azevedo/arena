'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, History, UsersRound } from 'lucide-react';

const items = [
  {
    href: '/groups',
    label: 'Grupos',
    icon: UsersRound,
  },
  {
    href: '/ranking',
    label: 'Ranking',
    icon: BarChart3,
  },
  {
    href: '/matches',
    label: 'Partidas',
    icon: History,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex justify-center gap-8">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/groups' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${
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
