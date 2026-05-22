'use client';

import { LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getAccessToken } from '@/lib/auth';
import { ProfileSignedOutState } from './components/profile-signed-out-state';
import { SettingsBackLink } from './components/settings-back-link';

export function ProfilePasswordSettings() {
  const token = getAccessToken();

  if (!token) {
    return <ProfileSignedOutState />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <SettingsBackLink href="/profile/settings">Configurações</SettingsBackLink>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
            Segurança
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.06em]">Alterar senha</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Atualize sua senha em uma tela própria, separada dos dados do perfil.
          </p>
        </div>
      </header>

      <Card className="border-primary/15 bg-card/95 shadow-[0_18px_55px_rgba(84,54,20,0.12)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold tracking-[-0.02em]">Formulário de senha</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                O formulário final deve chamar o endpoint de segurança já disponível no backend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
