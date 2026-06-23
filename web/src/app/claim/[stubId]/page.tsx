import { AppShell } from '@/components/app-shell';
import { ClaimOfferClient } from '@/features/claim-offers/components/claim-offer-client';

type Props = {
  params: Promise<{ stubId: string }>;
};

// Confirm screen for an email-anchored claim offer (reached from the CLAIM_OFFER
// notification). Auth-gated; the server authorizes by the viewer's email matching the
// stub's anchored email. Focused conversion screen — no app chrome.
export default async function ClaimOfferPage({ params }: Props) {
  const { stubId } = await params;

  return (
    <AppShell chrome={{ topBar: false, bottomNav: false }}>
      <ClaimOfferClient stubId={stubId} />
    </AppShell>
  );
}
