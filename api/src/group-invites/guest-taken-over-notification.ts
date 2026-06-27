// The GUEST_TAKEN_OVER notification's render payload — informational, sent to the group's
// admins when someone takes over a guest via an invite. No action in V1; a one-tap revert
// action is planned for V2 (the backend unlink already exists).
export function guestTakenOverNotificationData(
  takerName: string,
  groupName: string,
) {
  return {
    title: `${takerName} assumiu um perfil no ${groupName}`,
    body: 'Entrou pelo convite e levou o histórico do convidado para a conta.',
    meta: 'convidado',
    actions: [] as { label: string; href: string }[],
  };
}
