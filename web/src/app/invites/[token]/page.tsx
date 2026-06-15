import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { InviteAcceptClient } from '@/features/invites/components/invite-accept-client';
import { getInvite } from '@/features/invites/api/invites.api';

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
      <AppShell chrome={{ title: 'Convite para grupo', back: { fallbackHref: '/' } }}>
        <div className="space-y-6">
          <PageIntro description="Entre no grupo para registrar partidas e acompanhar o ranking." />
          <InviteAcceptClient invite={invite} />
        </div>
      </AppShell>
    );
  } catch {
    notFound();
  }
}
