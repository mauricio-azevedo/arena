import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { InviteAcceptClient } from '@/features/invites/components/invite-accept-client';
import { PageHeader } from '@/components/page-header';
import { getInvite } from '@/features/invites/invites.api';

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  try {
    const invite = await getInvite(token);

    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Convite para grupo"
            description="Entre no grupo para registrar partidas e acompanhar o ranking."
          />

          <InviteAcceptClient invite={invite} />
        </div>
      </AppShell>
    );
  } catch {
    notFound();
  }
}
