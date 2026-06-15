'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/features/auth/auth.api';
import { setAccessToken } from '@/lib/auth';

function getSafeRedirectUrl(redirect: string | null) {
  if (!redirect) {
    return '/';
  }

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }

  return redirect;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      const result = await login({
        email,
        password,
      });

      setAccessToken(result.accessToken);
      const searchParams = new URLSearchParams(window.location.search);
      router.push(getSafeRedirectUrl(searchParams.get('redirect')));
      router.refresh();
    } catch {
      setError('Não foi possível entrar. Verifique seu e-mail e senha.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell chrome={{ title: 'Entrar', back: { fallbackHref: '/', behavior: 'fallback' } }}>
      <div className="space-y-6">
        <PageIntro description="Acesse sua conta para ver seus grupos e registrar partidas." />

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
