export type NotificationType =
  | 'CLAIM_OFFER'
  | 'CLAIM_OFFER_DECLINED'
  // Deprecated — pre-email-anchored claim flow (no longer generated).
  | 'CLAIM_REQUEST'
  | 'CLAIM_APPROVED'
  | 'CLAIM_DECLINED'
  | 'CLAIM_INVITE';

export type NotificationAction = { label: string; href: string };

// In-app notification. `data` is a denormalized render payload frozen at write time.
export type AppNotification = {
  id: string;
  type: NotificationType;
  groupId: string | null;
  actorUserId: string | null;
  data: {
    title?: string;
    body?: string;
    meta?: string;
    actions?: NotificationAction[];
  };
  read: boolean;
  acted: boolean;
  createdAt: string;
};
