import { AppShell } from '@/components/app-shell';
import { GroupInviteClient } from '@/components/group-invite-client';
import { PageHeader } from '@/components/page-header';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupInvitePage({ params }: Props) {
  const { groupId } = await params;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Convidar pessoas"
          description="Gere um link para chamar pessoas para este grupo."
        />

        <GroupInviteClient groupId={groupId} />
      </div>
    </AppShell>
  );
}
