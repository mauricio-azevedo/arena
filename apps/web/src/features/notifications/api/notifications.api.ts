import { apiRequest } from '@/lib/api-client';
import type { AppNotification } from '@/types/api';

export function getNotifications(token: string): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>('/me/notifications', {
    token,
    cache: 'no-store',
  });
}

export function getUnreadNotificationCount(token: string): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/me/notifications/unread-count', {
    token,
    cache: 'no-store',
  });
}

export function markAllNotificationsRead(token: string): Promise<{ updated: number }> {
  return apiRequest<{ updated: number }>('/me/notifications/read', {
    method: 'POST',
    token,
  });
}
