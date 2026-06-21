'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meta, Title } from '@/components/ui/text';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

export function HomeHeader({
  firstName,
  isLoggedIn,
  loading,
}: {
  firstName?: string;
  isLoggedIn: boolean;
  loading: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Meta className="block text-muted-foreground">{isLoggedIn ? greeting() : 'Olá,'}</Meta>
        {loading ? (
          <div className="mt-1.5 h-6 w-32 animate-pulse rounded-full bg-muted" />
        ) : (
          <Title className="mt-0.5 truncate">
            {isLoggedIn ? (firstName ?? 'Você') : 'Bem-vindo'}
          </Title>
        )}
      </div>

      {isLoggedIn ? (
        // Placeholder: notificações ainda não existem; botão inerte.
        <button
          type="button"
          aria-label="Notificações"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-foreground shadow-hairline transition-transform active:scale-95"
        >
          <Bell className="size-5" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <Button asChild size="lg">
          <Link href="/login">Entrar</Link>
        </Button>
      )}
    </header>
  );
}
