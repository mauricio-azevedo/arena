import { notFound } from 'next/navigation';
import { AddMatchForm } from '@/features/matches/components/add-match-form';
import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { PageHeader } from '@/components/page-header';
import { getGroup, getGroupMembers } from '@/features/groups/api/groups.api';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function NewGroupMatchPage({ params }: Props) {
  const { groupId } = await params;

  try {
    const [group, members] = await Promise.all([getGroup(groupId), getGroupMembers(groupId)]);

    return (
      <AppShell>
        <div className="space-y-6">
          <BackButton href={['', 'groups', group.id].join('/')} />
          <PageHeader title="Registrar partida" description={group.name} />
          <AddMatchForm groupId={group.id} members={members} />
        </div>
      </AppShell>
    );
  } catch {
    notFound();
  }
}
