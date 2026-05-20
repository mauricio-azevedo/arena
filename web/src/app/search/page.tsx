import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Buscar" description="Encontre grupos e pessoas." />

        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Em breve: busca por grupos, usuários e grupos movimentados.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
