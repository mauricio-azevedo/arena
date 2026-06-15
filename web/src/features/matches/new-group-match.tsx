import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/page-intro';
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
        <PageIntro description={group.name} />
        <AddMatchForm groupId={group.id} members={members} />
      </div>
    );
  } catch {
    notFound();
  }
}
