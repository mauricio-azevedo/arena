import { AppShell } from '@/components/app-shell';
import { NotificationsInbox } from '@/features/notifications/components/notifications-inbox';

export default function NotificationsPage() {
  return (
    <AppShell chrome={{ title: 'Notificações', back: { fallbackHref: '/' } }}>
      <NotificationsInbox />
    </AppShell>
  );
}
