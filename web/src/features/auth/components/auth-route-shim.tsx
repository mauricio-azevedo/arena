'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthDrawer, type AuthDrawerView } from '@/features/auth/auth-drawer-provider';
import { getAccessToken } from '@/lib/auth';

// There are no /login or /register screens anymore — auth is a sheet. These paths
// survive only as shims for deep links (e.g. invite emails): open the matching view
// over home, carrying any `?redirect=` along, then replace the URL with `/`.
export function AuthRouteShim({ view }: { view: AuthDrawerView }) {
  const router = useRouter();
  const { open } = useAuthDrawer();

  useEffect(() => {
    if (!getAccessToken()) {
      const redirectPath = new URLSearchParams(window.location.search).get('redirect') ?? undefined;
      open({ view, intent: { redirectPath } });
    }
    router.replace('/');
  }, [open, router, view]);

  return null;
}
