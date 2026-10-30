import { apiRequest } from '@/lib/api-client';
import type {
  AppNotification,
  NotificationsReadResponse,
  UnreadNotificationCountResponse,
} from '@arena/contracts/notifications';

export function getNotifications(token: string): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>('/me/notifications', {
    token,
    cache: 'no-store',
  });
}

export function getUnreadNotificationCount(
  token: string,
): Promise<UnreadNotificationCountResponse> {
  return apiRequest<UnreadNotificationCountResponse>('/me/notifications/unread-count', {
    token,
    cache: 'no-store',
  });
}

export function markAllNotificationsRead(token: string): Promise<NotificationsReadResponse> {
  return apiRequest<NotificationsReadResponse>('/me/notifications/read', {
    method: 'POST',
    token,
  });
}
