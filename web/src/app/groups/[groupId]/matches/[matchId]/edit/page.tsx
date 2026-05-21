import { notFound } from 'next/navigation';
import { AddMatchForm } from '@/features/matches/components/add-match-form';
import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { PageHeader } from '@/components/page-header';
import { getGroup, getGroupMembers } from '@/features/groups/api/groups.api';
import { getGroupMatch } from '@/features/matches/api/matches.api';

type Props = {
  params: Promise<{
    groupId: string;
    matchId: string;
  }>;
};

export default async function EditGroupMatchPage({ params }: Props) {
  const { groupId, matchId } = await params;

  try {
    const [group, members, match] = await Promise.all([
      getGroup(groupId),
      getGroupMembers(groupId),
      getGroupMatch(groupId, matchId),
    ]);

    return (
      <AppShell>
        <div className="space-y-6">
          <BackButton href={['', 'groups', group.id].join('/')} />
          <PageHeader title="Corrigir partida" description={group.name} />
          <AddMatchForm groupId={group.id} members={members} match={match} />
        </div>
      </AppShell>
    );
  } catch {
    notFound();
  }
}
