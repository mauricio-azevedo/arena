'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from '../api/profile-password.api';

type Props = {
  token: string;
  onCancel: () => void;
};

type PasswordVisibility = {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
};

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72;

export function ProfileSecurityCard({ token, onCancel }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState<PasswordVisibility>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(
    () => validatePasswordForm(currentPassword, newPassword, confirmPassword),
    [currentPassword, newPassword, confirmPassword],
  );

  const canSubmit =
    Boolean(currentPassword) &&
    Boolean(newPassword) &&
    Boolean(confirmPassword) &&
    !validation.blockingMessage &&
    !isSubmitting;

  function handleFieldChange(setValue: (value: string) => void, value: string) {
    setError('');
    setSuccessMessage('');
    setValue(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccessMessage('');

    if (validation.blockingMessage) {
      setError(validation.blockingMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(token, {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVisible({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
      setSuccessMessage('Senha atualizada com sucesso.');
    } catch (caughtError) {
      setError(getFriendlyPasswordError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/15 bg-card/95 shadow-[0_18px_55px_rgba(84,54,20,0.12)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold tracking-[-0.02em]">Alterar senha</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use uma senha nova para proteger sua conta. Ela não altera seu e-mail nem seus dados
              do perfil.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="profile-current-password"
            label="Senha atual"
            value={currentPassword}
            onChange={(value) => handleFieldChange(setCurrentPassword, value)}
            autoComplete="current-password"
            isVisible={visible.currentPassword}
            onToggleVisibility={() =>
              setVisible((current) => ({
                ...current,
                currentPassword: !current.currentPassword,
              }))
            }
            disabled={isSubmitting}
          />

          <PasswordField
            id="profile-new-password"
            label="Nova senha"
            value={newPassword}
            onChange={(value) => handleFieldChange(setNewPassword, value)}
            autoComplete="new-password"
            isVisible={visible.newPassword}
            onToggleVisibility={() =>
              setVisible((current) => ({
                ...current,
                newPassword: !current.newPassword,
              }))
            }
            disabled={isSubmitting}
          />

          <PasswordField
            id="profile-confirm-password"
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={(value) => handleFieldChange(setConfirmPassword, value)}
            autoComplete="new-password"
            isVisible={visible.confirmPassword}
            onToggleVisibility={() =>
              setVisible((current) => ({
                ...current,
                confirmPassword: !current.confirmPassword,
              }))
            }
            disabled={isSubmitting}
          />

          <PasswordGuidance
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            validation={validation}
          />

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-sm leading-6 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>

            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Salvando...' : 'Salvar senha'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  isVisible,
  onToggleVisibility,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          className="pl-10 pr-11"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="sr-only">{isVisible ? 'Ocultar senha' : 'Mostrar senha'}</span>
        </button>
      </div>
    </div>
  );
}

function PasswordGuidance({
  newPassword,
  confirmPassword,
  validation,
}: {
  newPassword: string;
  confirmPassword: string;
  validation: ReturnType<typeof validatePasswordForm>;
}) {
  const hasTypedNewPassword = Boolean(newPassword);
  const hasTypedConfirmation = Boolean(confirmPassword);

  return (
    <div className="space-y-1 rounded-2xl bg-muted/45 px-3 py-2 text-xs leading-5 text-muted-foreground">
      <p
        className={hasTypedNewPassword && validation.hasMinimumLength ? 'text-primary' : undefined}
      >
        Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
      </p>

      <p
        className={hasTypedNewPassword && validation.isWithinByteLimit ? 'text-primary' : undefined}
      >
        Até {MAX_PASSWORD_BYTES} bytes.
      </p>

      <p className={hasTypedConfirmation && validation.passwordsMatch ? 'text-primary' : undefined}>
        A confirmação precisa ser igual à nova senha.
      </p>
    </div>
  );
}

function validatePasswordForm(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const hasMinimumLength = newPassword.length >= MIN_PASSWORD_LENGTH;
  const isWithinByteLimit = getUtf8ByteLength(newPassword) <= MAX_PASSWORD_BYTES;
  const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword;

  let blockingMessage = '';

  if (!currentPassword) {
    blockingMessage = 'Informe sua senha atual.';
  } else if (!newPassword) {
    blockingMessage = 'Informe a nova senha.';
  } else if (!hasMinimumLength) {
    blockingMessage = `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  } else if (!isWithinByteLimit) {
    blockingMessage = `A nova senha precisa ter no máximo ${MAX_PASSWORD_BYTES} bytes.`;
  } else if (!confirmPassword) {
    blockingMessage = 'Confirme a nova senha.';
  } else if (!passwordsMatch) {
    blockingMessage = 'A confirmação precisa ser igual à nova senha.';
  }

  return {
    hasMinimumLength,
    isWithinByteLimit,
    passwordsMatch,
    blockingMessage,
  };
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function getFriendlyPasswordError(caughtError: unknown) {
  const message = caughtError instanceof Error ? caughtError.message : '';

  if (/invalid current password/i.test(message)) {
    return 'A senha atual está incorreta.';
  }

  if (/different from current password/i.test(message)) {
    return 'A nova senha precisa ser diferente da senha atual.';
  }

  if (/at least 6 characters/i.test(message)) {
    return 'A nova senha precisa ter pelo menos 6 caracteres.';
  }

  if (/at most 72 bytes/i.test(message)) {
    return 'A nova senha está longa demais.';
  }

  if (/missing token|invalid token/i.test(message)) {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }

  return 'Não foi possível alterar sua senha agora.';
}
