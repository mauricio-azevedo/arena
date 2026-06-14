import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { GroupHomeList } from '@/features/groups/components/group-home-list';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button asChild size="icon" variant="outline" className="rounded-full">
            <Link href="/groups/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Criar grupo</span>
            </Link>
          </Button>
        </div>

        <GroupHomeList />
      </div>
    </AppShell>
  );
}
