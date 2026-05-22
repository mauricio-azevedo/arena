'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAccessToken } from '@/lib/auth';
import { updateProfile } from '../api/profile.api';
import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  token: string;
  user: ProfileUser;
  onCancel: () => void;
  onSaved: (user: ProfileUser) => void;
  onTokenRefreshed: (token: string) => void;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
};

const MAX_NAME_LENGTH = 80;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileEditCard({ token, user, onCancel, onSaved, onTokenRefreshed }: Props) {
  const initialValues = useMemo(() => getInitialValues(user), [user]);

  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [email, setEmail] = useState(initialValues.email);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setEmail(initialValues.email);
  }, [initialValues]);

  const normalizedValues = useMemo(
    () => normalizeFormValues({ firstName, lastName, email }),
    [firstName, lastName, email],
  );

  const hasChanges =
    normalizedValues.firstName !== initialValues.firstName ||
    normalizedValues.lastName !== initialValues.lastName ||
    normalizedValues.email !== initialValues.email;

  function handleFieldChange(field: keyof FormValues, value: string) {
    setError('');
    setSuccessMessage('');

    if (field === 'firstName') {
      setFirstName(value);
      return;
    }

    if (field === 'lastName') {
      setLastName(value);
      return;
    }

    setEmail(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccessMessage('');

    const validationError = validateProfileForm(normalizedValues);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!hasChanges) {
      setError('Faça alguma alteração antes de salvar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfile(
        token,
        buildChangedPayload(initialValues, normalizedValues),
      );
      const updatedUser = {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      };

      setAccessToken(result.accessToken);
      onTokenRefreshed(result.accessToken);
      onSaved(updatedUser);
      setFirstName(updatedUser.firstName);
      setLastName(updatedUser.lastName);
      setEmail(updatedUser.email ?? '');
      setSuccessMessage('Perfil atualizado com sucesso.');
    } catch (caughtError) {
      setError(getFriendlyUpdateError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/15 bg-card/95 shadow-[0_18px_55px_rgba(84,54,20,0.12)]">
      <CardContent className="space-y-4 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ProfileField
              id="profile-first-name"
              label="Nome"
              value={firstName}
              onChange={(value) => handleFieldChange('firstName', value)}
              autoComplete="given-name"
              disabled={isSubmitting}
            />

            <ProfileField
              id="profile-last-name"
              label="Sobrenome"
              value={lastName}
              onChange={(value) => handleFieldChange('lastName', value)}
              autoComplete="family-name"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="profile-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
                className="pl-10"
              />
            </div>
          </div>

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

            <Button type="submit" disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
      />
    </div>
  );
}

function getInitialValues(user: ProfileUser): FormValues {
  return normalizeFormValues({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? '',
  });
}

function normalizeFormValues(values: FormValues): FormValues {
  return {
    firstName: normalizeName(values.firstName),
    lastName: normalizeName(values.lastName),
    email: values.email.trim().toLowerCase(),
  };
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function validateProfileForm(values: FormValues) {
  if (!values.firstName) {
    return 'Informe seu nome.';
  }

  if (!values.lastName) {
    return 'Informe seu sobrenome.';
  }

  if (values.firstName.length > MAX_NAME_LENGTH || values.lastName.length > MAX_NAME_LENGTH) {
    return `Nome e sobrenome devem ter no máximo ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!values.email) {
    return 'Informe seu e-mail.';
  }

  if (!EMAIL_REGEX.test(values.email)) {
    return 'Informe um e-mail válido.';
  }

  return '';
}

function buildChangedPayload(initialValues: FormValues, values: FormValues) {
  return {
    ...(values.firstName !== initialValues.firstName ? { firstName: values.firstName } : {}),
    ...(values.lastName !== initialValues.lastName ? { lastName: values.lastName } : {}),
    ...(values.email !== initialValues.email ? { email: values.email } : {}),
  };
}

function getFriendlyUpdateError(caughtError: unknown) {
  const message = caughtError instanceof Error ? caughtError.message : '';

  if (/email already in use/i.test(message)) {
    return 'Este e-mail já está em uso.';
  }

  if (/invalid email/i.test(message)) {
    return 'Informe um e-mail válido.';
  }

  if (/missing token|invalid token/i.test(message)) {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }

  return 'Não foi possível atualizar seu perfil agora.';
}
