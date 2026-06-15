'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/features/auth/auth.api';
import {
  buildAuthHref,
  getSafeAuthRedirectPath,
} from '@/features/auth/helpers/auth-redirect.helper';
import { setAccessToken } from '@/lib/auth';

type LoginFormProps = {
  redirectPath: string;
};

export function LoginForm({ redirectPath }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeRedirectPath = getSafeAuthRedirectPath(redirectPath);

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
      router.replace(safeRedirectPath);
      router.refresh();
    } catch {
      setError('Não foi possível entrar. Verifique seu e-mail e senha.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
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
          href={buildAuthHref('/register', safeRedirectPath)}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}
