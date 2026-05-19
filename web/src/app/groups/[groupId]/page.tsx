import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { GroupDetailTabs } from '@/features/groups/components/group-detail-tabs';
import { PageHeader } from '@/components/page-header';
import { GroupActions } from '@/features/groups/components/group-actions';
import { getGroup, getGroupMembers, getGroupRanking } from '@/features/groups/groups.api';
import { getGroupMatches } from '@/features/matches/matches.api';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function GroupDetailPage({ params, searchParams }: Props) {
  const { groupId } = await params;
  const { tab } = await searchParams;

  const activeTab = tab === 'matches' || tab === 'members' || tab === 'ranking' ? tab : 'ranking';

  try {
    const [group, ranking, members, matches] = await Promise.all([
      getGroup(groupId),
      getGroupRanking(groupId),
      getGroupMembers(groupId),
      getGroupMatches(groupId),
    ]);

    return (
      <AppShell>
        <div className="space-y-6">
          <div className="space-y-4">
            <PageHeader
              title={group.name}
              description={group.description ?? 'Grupo público do BeachRank.'}
            />

            <GroupActions groupId={group.id} />
          </div>

          <GroupDetailTabs
            groupId={group.id}
            activeTab={activeTab}
            ranking={ranking}
            members={members}
            matches={matches}
          />
        </div>
      </AppShell>
    );
  } catch {
    notFound();
  }
}
