import { AppShell } from '@/components/app-shell';
import { GroupsTabs } from '@/features/groups/components/groups-tabs';
import { PageHeader } from '@/components/page-header';
import { getGroups } from '@/features/groups/groups.api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthStatus } from '@/features/auth/components/auth-status';

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Grupos"
          description="Veja grupos públicos ou entre na sua conta para acompanhar seus grupos."
        />

        <Button asChild className="w-full">
          <Link href="/groups/new">Criar grupo</Link>
        </Button>

        <AuthStatus />

        <GroupsTabs groups={groups} />
      </div>
    </AppShell>
  );
}
