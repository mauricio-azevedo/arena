import Link from 'next/link';
import { Plus, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignedOutCtaCard } from '@/features/auth/components/signed-out-cta-card';

export function GroupHomeLoadingState() {
  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-52 animate-pulse rounded-full bg-muted/70" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
      </div>
      <Card className="bg-gradient-to-br from-card via-card to-primary/12">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 animate-pulse rounded-[1.45rem] bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted/70" />
            </div>
          </div>
          <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted/70" />
          <div className="h-12 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
      <section className="space-y-3">
        {[0, 1].map((index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 animate-pulse rounded-[1.25rem] bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted/70" />
                </div>
              </div>
              <div className="h-14 animate-pulse rounded-[1.5rem] bg-muted/70" />
            </CardContent>
          </Card>
        ))}
      </section>
    </section>
  );
}

export function GroupHomeErrorState() {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-medium text-foreground">Não foi possível carregar seus grupos</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
      </CardContent>
    </Card>
  );
}

export function GroupHomeEmptyState({ hasToken }: { hasToken: boolean }) {
  if (!hasToken) {
    return (
      <SignedOutCtaCard
        icon={UsersRound}
        title="Comece no Arena"
        description="Crie sua conta para salvar grupos, acompanhar rankings e registrar partidas."
        redirectPath="/"
        primaryAction="register"
      />
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-muted text-foreground">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Crie seu primeiro grupo</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Convide seus amigos, registre partidas e acompanhe o ranking.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild className="rounded-full">
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" /> Criar grupo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
