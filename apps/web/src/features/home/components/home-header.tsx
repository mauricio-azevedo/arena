'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeaderShell } from '@/components/app-header-shell';
import { Button } from '@/components/ui/button';
import { Meta, Title } from '@/components/ui/text';
import { getMe } from '@/features/auth/api/auth.api';
import { buildAuthPath } from '@/features/auth/auth-navigation';
import { useAccessToken } from '@/hooks/use-access-token';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

// The name a token resolved to, keyed by that token so a session change never shows
// the previous user's name. `firstName` undefined = lookup failed, show the fallback.
type ResolvedName = { token: string; firstName?: string };

export function HomeHeader() {
  const token = useAccessToken();
  const [resolvedName, setResolvedName] = useState<ResolvedName | null>(null);

  useEffect(() => {
    if (!token) return;

    let isCurrent = true;

    getMe(token)
      .then((user) => {
        if (isCurrent) setResolvedName({ token, firstName: user.firstName });
      })
      .catch(() => {
        if (isCurrent) setResolvedName({ token });
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const isLoggedIn = Boolean(token);
  const name = resolvedName?.token === token ? resolvedName : null;
  // Skeleton until storage is readable, then while the signed-in name loads.
  const loading = token === undefined || (isLoggedIn && name === null);

  return (
    <AppHeaderShell>
      <div className="relative mx-auto flex h-12 w-full max-w-md items-center justify-between gap-base leading-tight">
        <div className="min-w-0">
          <Meta className="block text-muted-foreground">{isLoggedIn ? greeting() : 'Olá,'}</Meta>
          {loading ? (
            // mt-0.5: 2px optical nudge aligning the skeleton line where the Title sits.
            <div className="mt-0.5 h-5 w-28 animate-pulse rounded-full bg-muted" />
          ) : (
            <Title className="truncate">
              {isLoggedIn ? (name?.firstName ?? 'Você') : 'Bem-vindo'}
            </Title>
          )}
        </div>

        {isLoggedIn ? (
          <NotificationBell />
        ) : (
          <Button asChild size="lg">
            <Link href={buildAuthPath({ mode: 'login' })}>Entrar</Link>
          </Button>
        )}
      </div>
    </AppHeaderShell>
  );
}
