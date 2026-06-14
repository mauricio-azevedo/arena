'use client';

import { ChevronRight, KeyRound, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { BackButton } from '@/components/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyH1, TypographyMuted, TypographySmall } from '@/components/ui/typography';
import { getAccessToken } from '@/lib/auth';
import { ProfileSignedOutState } from './components/profile-signed-out-state';

export function ProfileSettings() {
  const router = useRouter();
  const token = getAccessToken();

  if (!token) {
    return <ProfileSignedOutState />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <BackButton href="/profile" />

        <div>
          <TypographySmall>Conta</TypographySmall>
          <TypographyH1>Configurações</TypographyH1>
          <TypographyMuted>Atualize suas informações de conta.</TypographyMuted>
        </div>
      </header>

      <section className="space-y-3">
        <SettingsOption
          icon={<UserRound className="h-5 w-5" />}
          title="Perfil"
          description="Nome, sobrenome e e-mail."
          onClick={() => router.push('/profile/settings/profile')}
        />

        <SettingsOption
          icon={<KeyRound className="h-5 w-5" />}
          title="Senha"
          description="Senha de acesso da conta."
          onClick={() => router.push('/profile/settings/password')}
        />
      </section>
    </div>
  );
}

function SettingsOption({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">{icon}</div>

          <div className="min-w-0 flex-1">
            <TypographySmall>{title}</TypographySmall>
            <TypographyMuted>{description}</TypographyMuted>
          </div>

          <ChevronRight className="h-5 w-5 shrink-0" />
        </CardContent>
      </Card>
    </button>
  );
}
