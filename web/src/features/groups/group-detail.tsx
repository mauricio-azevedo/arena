import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { GroupDetailTabs } from '@/features/groups/components/group-detail-tabs';
import { PageHeader } from '@/components/page-header';
import { GroupActions } from '@/features/groups/components/group-actions';
import { getGroup, getGroupMembers, getGroupRanking } from '@/features/groups/api/groups.api';
import { getGroupMatches } from '@/features/matches/api/matches.api';

type Props = {
  groupId: string;
  tab?: string;
};

export async function GroupDetail({ groupId, tab }: Props) {
  const activeTab = tab === 'matches' || tab === 'members' || tab === 'ranking' ? tab : 'ranking';

  try {
    const [group, ranking, members, matches] = await Promise.all([
      getGroup(groupId),
      getGroupRanking(groupId),
      getGroupMembers(groupId),
      getGroupMatches(groupId),
    ]);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <BackButton href="/groups" />

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
    );
  } catch {
    notFound();
  }
}
