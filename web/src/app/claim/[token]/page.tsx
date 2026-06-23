import { notFound } from 'next/navigation';
import type { GroupInvite } from '@/types/api';
import { AppShell } from '@/components/app-shell';
import { ClaimAcceptClient } from '@/features/invites/components/claim-accept-client';
import { getInvite } from '@/features/invites/api/invites.api';

type Props = {
  params: Promise<{
    token: string;
  }>;
};

// A claim link is opened cold from outside the app, so this is a focused conversion
// screen: no app chrome (top bar / dock), the page carries its own group context.
export default async function ClaimPage({ params }: Props) {
  const { token } = await params;

  let invite: GroupInvite;
  try {
    invite = await getInvite(token);
  } catch {
    notFound();
  }

  return (
    <AppShell chrome={{ topBar: false, bottomNav: false }}>
      <ClaimAcceptClient invite={invite} />
    </AppShell>
  );
}
