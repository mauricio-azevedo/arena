import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { PageHeader } from '@/components/page-header';
import { getGroup, getGroupMembers } from '@/features/groups/api/groups.api';
import { getGroupMatch } from './api/matches.api';
import { AddMatchForm } from './components/add-match-form';

type Props = {
  groupId: string;
  matchId: string;
};

export async function EditGroupMatch({ groupId, matchId }: Props) {
  try {
    const [group, members, match] = await Promise.all([
      getGroup(groupId),
      getGroupMembers(groupId),
      getGroupMatch(groupId, matchId),
    ]);

    return (
      <div className="space-y-6">
        <BackButton href={['', 'groups', group.id].join('/')} label="Grupo" />
        <PageHeader title="Corrigir partida" description={group.name} />
        <AddMatchForm groupId={group.id} members={members} match={match} />
      </div>
    );
  } catch {
    notFound();
  }
}
