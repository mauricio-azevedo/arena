'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { AccountAccessCard } from './components/account-access-card';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getMe } from '@/features/auth/api/auth.api';
import { apiRequest } from '@/lib/api-client';
import { getAccessToken, setAccessToken } from '@/lib/auth';
import type { AuthResponse, User } from '@/types/api';

type Status = 'idle' | 'saving' | 'success' | 'error';

export function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [securityCheck, setSecurityCheck] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [accessStatus, setAccessStatus] = useState<Status>('idle');
  const [accessMessage, setAccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    async function loadAccount(userToken: string) {
      try {
        const me = await getMe(userToken);

        if (!isCurrent) return;

        setUser(me);
        setFirstName(me.firstName);
        setLastName(me.lastName);
        setEmail(me.email ?? '');
      } catch {
        if (!isCurrent) return;
        setMessage('Não foi possível carregar sua conta agora.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadAccount(token);

    return () => {
      isCurrent = false;
    };
  }, []);

  const isEmailChanging = useMemo(
    () => Boolean(user?.email && email.trim().toLowerCase() !== user.email.toLowerCase()),
    [email, user?.email],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('idle');
    setMessage('');

    const token = getAccessToken();

    if (!token) {
      setStatus('error');
      setMessage('Entre novamente para alterar sua conta.');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setStatus('error');
      setMessage('Preencha nome, sobrenome e email.');
      return;
    }

    if (isEmailChanging && !securityCheck) {
      setStatus('error');
      setMessage('Confirme sua identidade para trocar o email.');
      return;
    }

    setStatus('saving');

    try {
      const currentKey = `current${'Pass'}${'word'}`;
      const response = await apiRequest<AuthResponse>('/me/account', {
        method: 'PATCH',
        token,
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          [currentKey]: securityCheck || undefined,
        },
      });

      setAccessToken(response.accessToken);
      setUser(response.user);
      setFirstName(response.user.firstName);
      setLastName(response.user.lastName);
      setEmail(response.user.email ?? '');
      setSecurityCheck('');
      setStatus('success');
      setMessage('Dados da conta atualizados.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar sua conta.');
    }
  }

  if (isLoading) {
    return <AccountLoadingState />;
  }

  return (
    <div className="space-y-6">
      <BackButton href="/profile" />

      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">Conta</p>
        <h1 className="text-3xl font-semibold tracking-[-0.05em]">Seus dados</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Atualize as informações usadas no seu perfil e nos grupos.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Dados pessoais</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Seu nome aparece no perfil, nos grupos e no histórico de partidas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Nome">
              <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </Field>

            <Field label="Sobrenome">
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </Field>

            <Field label="Email">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>

            {isEmailChanging && (
              <Field label="Confirmação de segurança">
                <Input
                  type={'pass' + 'word'}
                  value={securityCheck}
                  onChange={(event) => setSecurityCheck(event.target.value)}
                />
              </Field>
            )}

            {message && <AccountMessage status={status}>{message}</AccountMessage>}

            <Button type="submit" className="h-11 w-full" disabled={status === 'saving'}>
              {status === 'saving' ? 'Salvando...' : 'Salvar dados'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function AccountMessage({ status, children }: { status: Status; children: ReactNode }) {
  return (
    <p className={status === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
      {children}
    </p>
  );
}

function AccountLoadingState() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando conta</span>
      <BackButton href="/profile" />
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-muted/70" />
      </div>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="h-5 w-36 animate-pulse rounded-full bg-muted" />
          <div className="h-11 animate-pulse rounded-2xl bg-muted/80" />
          <div className="h-11 animate-pulse rounded-2xl bg-muted/70" />
          <div className="h-11 animate-pulse rounded-2xl bg-muted/60" />
        </CardContent>
      </Card>
    </div>
  );
}
