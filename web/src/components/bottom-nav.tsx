'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, History, PlusCircle, Users } from 'lucide-react';

const items = [
  {
    href: '/ranking',
    label: 'Ranking',
    icon: BarChart3,
  },
  {
    href: '/players',
    label: 'Jogadores',
    icon: Users,
  },
  {
    href: '/matches/new',
    label: 'Nova Partida',
    icon: PlusCircle,
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
      <div className="mx-auto grid h-16 max-w-md grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/ranking' && pathname.startsWith(item.href));

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
