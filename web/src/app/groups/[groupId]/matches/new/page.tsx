import { AppShell } from '@/components/app-shell';
import { NewGroupMatch } from '@/features/matches/new-group-match';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function NewGroupMatchPage({ params }: Props) {
  const { groupId } = await params;

  return (
    <AppShell chrome={{ title: 'Registrar partida', back: { fallbackHref: '/groups/' + groupId } }}>
      <NewGroupMatch groupId={groupId} />
    </AppShell>
  );
}
