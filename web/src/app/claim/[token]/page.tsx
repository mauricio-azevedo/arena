import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { ClaimAcceptClient } from '@/features/invites/components/claim-accept-client';
import { getInvite } from '@/features/invites/api/invites.api';

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;

  try {
    const invite = await getInvite(token);

    return (
      <AppShell chrome={{ title: 'Assumir perfil', back: { fallbackHref: '/' } }}>
        <div className="space-y-6">
          <PageIntro description="Assuma o perfil deste jogador e mantenha todo o histórico." />
          <ClaimAcceptClient invite={invite} />
        </div>
      </AppShell>
    );
  } catch {
    notFound();
  }
}
