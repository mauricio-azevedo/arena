import type { LucideIcon } from 'lucide-react';
import { Search, Sparkles, UsersRound } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyH4, TypographyMuted, TypographySmall } from '@/components/ui/typography';

export default function SearchPage() {
  return (
    <AppShell chrome={{ title: 'Buscar' }}>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Descobrir"
          description="Encontre grupos, pessoas e comunidades movimentadas no Arena."
        />

        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex h-12 w-12 items-center justify-center">
              <Search className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <TypographyH4>Busca em breve</TypographyH4>
              <TypographyMuted>
                Em breve será possível encontrar grupos por nome, descobrir jogadores e ver
                comunidades com partidas recentes.
              </TypographyMuted>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
    <div className="p-3">
      <Icon className="h-4 w-4" />
      <TypographySmall>{label}</TypographySmall>
    </div>
  );
}
