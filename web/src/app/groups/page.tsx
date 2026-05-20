import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { MyGroupsList } from '@/features/groups/components/my-groups-list';

export default function GroupsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">BeachRank</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Grupos</h1>
          </div>

          <Button asChild size="icon" variant="outline" className="mt-1 rounded-full">
            <Link href="/groups/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Criar grupo</span>
            </Link>
          </Button>
        </header>

        <MyGroupsList />
      </div>
    </AppShell>
  );
}
