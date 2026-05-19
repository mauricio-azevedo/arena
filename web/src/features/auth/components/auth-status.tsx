'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMe } from '@/features/auth/auth.api';
import { getAccessToken, removeAccessToken } from '@/lib/auth';
import type { User } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsChecking(false);
      return;
    }

    async function loadUser(authToken: string) {
      try {
        const currentUser = await getMe(authToken);
        setUser(currentUser);
      } catch {
        removeAccessToken();
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    }

    loadUser(token);
  }, []);

  function handleLogout() {
    removeAccessToken();
    setUser(null);
    window.location.href = '/groups';
  }

  if (isChecking) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Verificando conta...
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Você não está logado</p>
            <p className="text-xs text-muted-foreground">Entre para ver seus grupos.</p>
          </div>

          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/login">Entrar</Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href="/register">Criar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          Sair
        </Button>
      </CardContent>
    </Card>
  );
}
