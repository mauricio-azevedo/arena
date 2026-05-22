'use client';

import { ChevronRight, KeyRound, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <header className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          className="-ml-3 h-9 px-3 text-sm text-muted-foreground"
          onClick={() => router.push('/profile')}
        >
          Voltar ao perfil
        </Button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
            Conta
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.06em]">Configurações</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Gerencie seus dados pessoais e opções de segurança em telas separadas.
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <SettingsOption
          icon={<UserRound className="h-5 w-5" />}
          title="Alterar perfil"
          description="Atualize seu nome, sobrenome e e-mail de acesso."
          onClick={() => router.push('/profile/settings/profile')}
        />

        <SettingsOption
          icon={<KeyRound className="h-5 w-5" />}
          title="Alterar senha"
          description="Troque sua senha em uma tela própria."
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
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="transition-colors hover:bg-muted/35">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-[-0.02em]">{title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </button>
  );
}
