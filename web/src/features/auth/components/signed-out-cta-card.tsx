import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildAuthHref } from '@/features/auth/helpers/auth-redirect.helper';

type AuthPrimaryAction = 'login' | 'register';

type SignedOutCtaCardProps = {
  title: string;
  description: string;
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
  const loginHref = buildAuthHref('/login', redirectPath);
  const registerHref = buildAuthHref('/register', redirectPath);
  const primaryHref = primaryAction === 'login' ? loginHref : registerHref;
  const secondaryHref = primaryAction === 'login' ? registerHref : loginHref;
  const primaryLabel = primaryAction === 'login' ? 'Entrar' : 'Criar conta';
  const secondaryLabel = primaryAction === 'login' ? 'Criar conta' : 'Entrar';

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
          <Button asChild className="rounded-full">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>

          <Button asChild variant="outline" className="rounded-full">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
