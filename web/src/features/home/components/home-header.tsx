'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meta, Title } from '@/components/ui/text';
import { getMe } from '@/features/auth/api/auth.api';
import { getAccessToken } from '@/lib/auth';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

export function HomeHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const token = getAccessToken();
    setIsLoggedIn(Boolean(token));

    if (!token) {
      setLoading(false);
      return;
    }

    getMe(token)
      .then((user) => {
        if (isCurrent) {
          setFirstName(user.firstName);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    // Mesma casca do AppTopBar (fixed + blur + safe-area + linha h-11) pra a posição
    // e a altura baterem com o header da tela de grupo.
    <header className="fixed inset-x-0 top-0 z-50 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-xs" />

      <div className="relative mx-auto flex h-11 w-full max-w-md items-center justify-between gap-3 leading-tight">
        <div className="min-w-0">
          <Meta className="block text-muted-foreground">{isLoggedIn ? greeting() : 'Olá,'}</Meta>
          {loading ? (
            <div className="mt-0.5 h-5 w-28 animate-pulse rounded-full bg-muted" />
          ) : (
            <Title className="truncate">{isLoggedIn ? (firstName ?? 'Você') : 'Bem-vindo'}</Title>
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
      </div>
    </header>
  );
}
