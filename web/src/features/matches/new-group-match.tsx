import { notFound } from 'next/navigation';
import { getGroup, getGroupMembers } from '@/features/groups/api/groups.api';
import { AddMatchForm } from './components/add-match-form';

type Props = {
  groupId: string;
};

export async function NewGroupMatch({ groupId }: Props) {
  try {
    const [group, members] = await Promise.all([getGroup(groupId), getGroupMembers(groupId)]);

    return <AddMatchForm groupId={group.id} members={members} />;
  } catch {
    notFound();
  }
}
