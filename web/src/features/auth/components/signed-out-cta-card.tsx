'use client';

import type { LucideIcon } from 'lucide-react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthDrawer, type AuthDrawerView } from '@/features/auth/auth-drawer-provider';

type AuthPrimaryAction = 'login' | 'register';

type SignedOutCtaCardProps = {
  title: string;
  description: string;
  // Where to land after authenticating (e.g. the screen this card sits on).
  redirectPath: string;
  primaryAction: AuthPrimaryAction;
  icon?: LucideIcon;
};

export function SignedOutCtaCard({
  title,
  description,
  redirectPath,
  primaryAction,
  icon: Icon = LogIn,
}: SignedOutCtaCardProps) {
  const { open } = useAuthDrawer();

  const primaryView: AuthDrawerView = primaryAction === 'login' ? 'login' : 'signup';
  const secondaryView: AuthDrawerView = primaryAction === 'login' ? 'signup' : 'login';
  const primaryLabel = primaryAction === 'login' ? 'Entrar' : 'Criar conta';
  const secondaryLabel = primaryAction === 'login' ? 'Criar conta' : 'Entrar';

  const openView = (view: AuthDrawerView) => open({ view, intent: { redirectPath } });

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/10">
      <CardContent className="space-y-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.035em] text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button className="rounded-full" onClick={() => openView(primaryView)}>
            {primaryLabel}
          </Button>

          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => openView(secondaryView)}
          >
            {secondaryLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
