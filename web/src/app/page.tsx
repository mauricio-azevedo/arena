import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { GroupHomeList } from '@/features/groups/components/group-home-list';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Grupos"
          title="Seus grupos"
          description="Acompanhe onde você está no ranking, quem lidera e o que mudou em cada grupo."
          action={
            <Button asChild size="icon" variant="outline" className="rounded-full">
              <Link href="/groups/new">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Criar grupo</span>
              </Link>
            </Button>
          }
        />

        <GroupHomeList />
      </div>
    </AppShell>
  );
}
