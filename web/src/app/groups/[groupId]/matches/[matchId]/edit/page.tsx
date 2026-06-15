import { AppShell } from '@/components/app-shell';
import { EditGroupMatch } from '@/features/matches/edit-group-match';

type Props = {
  params: Promise<{
    groupId: string;
    matchId: string;
  }>;
};

export default async function EditGroupMatchPage({ params }: Props) {
  const { groupId, matchId } = await params;

  return (
    <AppShell chrome={{ title: 'Corrigir partida', back: { fallbackHref: '/groups/' + groupId } }}>
      <EditGroupMatch groupId={groupId} matchId={matchId} />
    </AppShell>
  );
}
