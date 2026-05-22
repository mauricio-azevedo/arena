import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { PageHeader } from '@/components/page-header';
import { getGroup, getGroupMembers } from '@/features/groups/api/groups.api';
import { AddMatchForm } from './components/add-match-form';

type Props = {
  groupId: string;
};

export async function NewGroupMatch({ groupId }: Props) {
  try {
    const [group, members] = await Promise.all([getGroup(groupId), getGroupMembers(groupId)]);

    return (
      <div className="space-y-6">
        <BackButton href={['', 'groups', group.id].join('/')} />
        <PageHeader title="Registrar partida" description={group.name} />
        <AddMatchForm groupId={group.id} members={members} />
      </div>
    );
  } catch {
    notFound();
  }
}
