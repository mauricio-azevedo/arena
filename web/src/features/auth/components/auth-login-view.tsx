'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DrawerActionHeader, DrawerFooter } from '@/components/ui/drawer';
import { SheetField, SheetPasswordField } from '@/components/ui/sheet-field';
import { Meta } from '@/components/ui/text';
import { login } from '@/features/auth/auth.api';
import { AUTH_EMAIL_REGEX, LOGIN_ERROR } from '@/features/auth/auth-validation';
import { setAccessToken } from '@/lib/auth';

// Login view inside the auth drawer. On success it stores the token and hands off
// to `onAuthenticated` (a full-page navigation), so there's no state to reset.
export function AuthLoginView({
  onAuthenticated,
  onSwitchToSignup,
}: {
  onAuthenticated: () => void;
  onSwitchToSignup: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = AUTH_EMAIL_REGEX.test(email.trim()) && password.length > 0;

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password });
      setAccessToken(result.accessToken);
      onAuthenticated();
    } catch {
      setError(LOGIN_ERROR);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerActionHeader title="Entrar" />

      <form
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="overflow-hidden rounded-card bg-surface shadow-hairline">
          <SheetField
            id="auth-email"
            label="E-mail"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            disabled={isSubmitting}
          />
          <div className="h-px bg-border" />
          <SheetPasswordField
            id="auth-password"
            label="Senha"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="button"
          onClick={onSwitchToSignup}
          disabled={isSubmitting}
          className="mt-5 block w-full text-center text-sm font-bold text-muted-foreground transition-opacity active:opacity-60 disabled:opacity-40"
        >
          Não tem conta? <span className="text-brand">Criar conta</span>
        </button>

        {/* Submit on Enter; the footer "Entrar" is the primary trigger. */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden disabled={!canSubmit} />
      </form>

      <DrawerFooter className="gap-2.5 pt-2.5 pb-[30px] shadow-[0_-1px_0_var(--surface)]">
        {error && <Meta className="text-center text-danger">{error}</Meta>}
        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          disabled={!canSubmit}
          onClick={() => handleSubmit()}
        >
          Entrar
        </Button>
      </DrawerFooter>
    </div>
  );
}
