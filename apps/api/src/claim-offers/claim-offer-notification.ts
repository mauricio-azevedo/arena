// The CLAIM_OFFER notification's render payload (copy + deep-link), shared by the live
// anchor path (ClaimOffersService.notifyOffer) and the registration hook
// (AuthService.notifyPendingClaimOffers) so the two never drift.
export function claimOfferNotificationData(stubId: string, groupName: string) {
  return {
    title: `Você foi convidado pro ${groupName}`,
    body: 'E já tem partidas suas registradas lá — entre e elas viram suas.',
    meta: 'convite',
    actions: [{ label: 'Ver', href: `/claim/${stubId}` }],
  };
}
