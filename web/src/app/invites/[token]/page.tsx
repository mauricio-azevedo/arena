import { notFound } from 'next/navigation';
import { getInvite } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { InviteAcceptClient } from '@/components/invite-accept-client';
import { PageHeader } from '@/components/page-header';

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
