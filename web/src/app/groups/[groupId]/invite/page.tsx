import { AppShell } from '@/components/app-shell';
import { GroupInviteClient } from '@/features/invites/components/group-invite-client';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupInvitePage({ params }: Props) {
  const { groupId } = await params;

  return (
    <AppShell>
      <GroupInviteClient groupId={groupId} />
    </AppShell>
  );
}
