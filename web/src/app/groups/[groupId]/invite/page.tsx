import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { GroupInviteClient } from '@/features/invites/components/group-invite-client';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupInvitePage({ params }: Props) {
  const { groupId } = await params;

  return (
    <AppShell chrome={{ title: 'Convidar pessoas', back: { fallbackHref: '/groups/' + groupId } }}>
      <div className="space-y-6">
        <PageIntro description="Gere um link para chamar pessoas para este grupo." />
        <GroupInviteClient groupId={groupId} />
      </div>
    </AppShell>
  );
}
