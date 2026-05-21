import { Search, Sparkles, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Descobrir"
          title="Buscar"
          description="Encontre grupos, pessoas e comunidades movimentadas no BeachRank."
        />

        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Search className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-[-0.035em]">Busca em breve</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                A próxima evolução natural é encontrar grupos por nome, descobrir jogadores e ver
                comunidades com partidas recentes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <SearchPreviewItem icon={UsersRound} label="Grupos" />
              <SearchPreviewItem icon={Sparkles} label="Movimento" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SearchPreviewItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 font-semibold">{label}</p>
    </div>
  );
}
