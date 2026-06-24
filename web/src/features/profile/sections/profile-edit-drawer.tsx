'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { AVATAR_COLORS } from '@/lib/avatar-color';
import { setAccessToken } from '@/lib/auth';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Meta, Overline } from '@/components/ui/text';
import { updateProfile, type UpdateProfileInput } from '../api/profile.api';
import type { ProfileUser } from '../types/profile-user.type';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NICKNAME = 24;

export type EditedUser = {
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string | null;
  avatarColor: string | null;
};

export function ProfileEditDrawer({
  open,
  onOpenChange,
  token,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  user: ProfileUser;
  onSaved: (user: EditedUser) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        {/* Remount on open so the form always seeds from the latest user. */}
        {open && (
          <EditForm
            token={token}
            user={user}
            onCancel={() => onOpenChange(false)}
            onSaved={(edited) => {
              onSaved(edited);
              onOpenChange(false);
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function EditForm({
  token,
  user,
  onCancel,
  onSaved,
}: {
  token: string;
  user: ProfileUser;
  onCancel: () => void;
  onSaved: (user: EditedUser) => void;
}) {
  const initial = {
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname ?? '',
    email: user.email ?? '',
    // Every account has a colour; fall back to blue only defensively.
    avatarColor: user.avatarColor ?? 'blue',
  };

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [nickname, setNickname] = useState(initial.nickname);
  const [email, setEmail] = useState(initial.email);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const trimmed = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    nickname: nickname.trim(),
    email: email.trim(),
  };

  const isValid =
    trimmed.firstName.length > 0 &&
    trimmed.lastName.length > 0 &&
    EMAIL_REGEX.test(trimmed.email) &&
    trimmed.nickname.length <= MAX_NICKNAME;

  const hasChanges =
    trimmed.firstName !== initial.firstName ||
    trimmed.lastName !== initial.lastName ||
    trimmed.nickname !== initial.nickname ||
    trimmed.email !== initial.email.trim() ||
    avatarColor !== initial.avatarColor;

  async function handleSave() {
    if (!isValid || !hasChanges || isSubmitting) {
      return;
    }

    const payload: UpdateProfileInput = {};
    if (trimmed.firstName !== initial.firstName) payload.firstName = trimmed.firstName;
    if (trimmed.lastName !== initial.lastName) payload.lastName = trimmed.lastName;
    if (trimmed.nickname !== initial.nickname) payload.nickname = trimmed.nickname;
    if (trimmed.email !== initial.email.trim()) payload.email = trimmed.email;
    if (avatarColor !== initial.avatarColor) payload.avatarColor = avatarColor;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateProfile(token, payload);
      setAccessToken(result.accessToken);
      onSaved({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        nickname: result.user.nickname,
        email: result.user.email,
        avatarColor: result.user.avatarColor,
      });
    } catch (caughtError) {
      setError(friendlyError(caughtError));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-w-16 text-left text-label text-muted-foreground transition-opacity active:opacity-60 disabled:opacity-40"
        >
          Cancelar
        </button>
        <DrawerTitle>Editar perfil</DrawerTitle>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || !hasChanges || isSubmitting}
          className="min-w-16 text-right text-label font-bold text-brand transition-opacity active:opacity-60 disabled:opacity-40"
        >
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* avatar hero + color picker */}
        <div className="mt-tight mb-loose flex flex-col items-center">
          <MemberAvatar
            userId={user.id}
            name={`${firstName} ${lastName}`}
            avatarColor={avatarColor}
            size="2xl"
            className="shadow-float"
          />

          <div className="mt-section flex max-w-[19rem] flex-wrap justify-center gap-base">
            {AVATAR_COLORS.map((color) => {
              const selected = color.key === avatarColor;
              return (
                <button
                  key={color.key}
                  type="button"
                  aria-label={`Cor ${color.key}`}
                  aria-pressed={selected}
                  onClick={() => setAvatarColor(color.key)}
                  className="flex size-11 items-center justify-center rounded-full transition-transform active:scale-90"
                  style={{
                    backgroundImage: `linear-gradient(150deg, ${color.from}, ${color.to})`,
                    boxShadow: selected
                      ? `0 0 0 2px var(--background), 0 0 0 4px ${color.from}`
                      : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                  }}
                >
                  {selected && <Check className="size-[1.125rem] text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* fields */}
        <Overline className="mb-3 block px-1 text-faint-foreground">Informações</Overline>
        <div className="overflow-hidden rounded-card bg-surface shadow-hairline">
          <div className="flex items-stretch">
            <Field
              label="Nome"
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
            />
            <div className="w-px bg-border" />
            <Field
              label="Sobrenome"
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
            />
          </div>
          <div className="h-px bg-border" />
          <Field
            label="Apelido"
            value={nickname}
            onChange={setNickname}
            placeholder="Como te chamam"
            autoComplete="nickname"
          />
          <div className="h-px bg-border" />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
          />
        </div>
        <Meta className="mt-snug block px-1.5 leading-relaxed text-faint-foreground">
          O apelido é como você aparece para outros jogadores nos grupos.
        </Meta>

        {error && <Meta className="mt-comfortable block text-center text-danger">{error}</Meta>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col px-4 py-3">
      <Overline className="text-faint-foreground">{label}</Overline>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 w-full border-none bg-transparent p-0 text-body font-bold text-foreground outline-none placeholder:font-medium placeholder:text-faint-foreground"
      />
    </label>
  );
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('email') && message.includes('use')) {
    return 'Esse email já está em uso.';
  }
  return 'Não foi possível salvar. Tente novamente.';
}
