import { notFound } from 'next/navigation';
import { getGroup, getGroupMatch, getGroupMembers } from '@/lib/api';
import { AddMatchForm } from '@/components/add-match-form';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';

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
        <PageHeader title="Corrigir partida" description={group.name} />

        <AddMatchForm groupId={group.id} members={members} match={match} />
      </AppShell>
    );
  } catch {
    notFound();
  }
}
