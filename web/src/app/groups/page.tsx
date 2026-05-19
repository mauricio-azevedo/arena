import { AppShell } from '@/components/app-shell';
import { GroupsTabs } from '@/components/groups-tabs';
import { PageHeader } from '@/components/page-header';
import { getGroups } from '@/features/groups/groups.api';

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Grupos"
          description="Veja grupos públicos ou entre na sua conta para acompanhar seus grupos."
        />

        <GroupsTabs groups={groups} />
      </div>
    </AppShell>
  );
}
