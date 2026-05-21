import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { MyGroupsList } from '@/features/groups/components/my-groups-list';

export default function GroupsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Comunidades"
          title="Seus grupos"
          description="Entre nos grupos onde você joga, registre partidas e acompanhe o ranking da galera."
          action={
            <Button asChild size="icon" variant="outline" className="rounded-full">
              <Link href="/groups/new">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Criar grupo</span>
              </Link>
            </Button>
          }
        />

        <MyGroupsList />
      </div>
    </AppShell>
  );
}
