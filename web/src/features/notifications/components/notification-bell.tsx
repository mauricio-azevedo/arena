'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';
import { getUnreadNotificationCount } from '@/features/notifications/api/notifications.api';

// Top-bar entry to the notifications inbox, with an unread dot. Reads the unread count
// once on mount (no socket/poll yet — refreshed on navigation back to a screen with it).
export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const { count } = await getUnreadNotificationCount(token);
        if (isCurrent) setUnread(count);
      } catch {
        // A failed count just leaves the dot off — non-blocking.
      }
    }

    load();
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notificações (${unread} novas)` : 'Notificações'}
      className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-foreground shadow-hairline transition-transform active:scale-95"
    >
      <Bell className="size-5" strokeWidth={2} aria-hidden />
      {unread > 0 && (
        <span
          className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-brand shadow-[0_0_0_2px_var(--background)]"
          aria-hidden
        />
      )}
    </Link>
  );
}
