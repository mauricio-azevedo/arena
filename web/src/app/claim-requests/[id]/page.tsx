import { AppShell } from '@/components/app-shell';
import { ClaimRequestReview } from '@/features/claim-requests/components/claim-request-review';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClaimRequestPage({ params }: Props) {
  const { id } = await params;

  return (
    <AppShell chrome={{ title: 'Reivindicação', back: { fallbackHref: '/notifications' } }}>
      <ClaimRequestReview requestId={id} />
    </AppShell>
  );
}
