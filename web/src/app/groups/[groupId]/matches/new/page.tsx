import { notFound } from 'next/navigation';
import { getGroup, getGroupMembers } from '@/lib/api';
import { AddMatchForm } from '@/components/add-match-form';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';

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
        <PageHeader title="Registrar partida" description={group.name} />

        <AddMatchForm groupId={group.id} members={members} />
      </AppShell>
    );
  } catch {
    notFound();
  }
}
