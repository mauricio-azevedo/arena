'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSafeNavigation } from '@/providers/navigation-provider';

type NavigationTrackerProps = {
  enabled?: boolean;
};

export function NavigationTracker({ enabled = true }: NavigationTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registerHref } = useSafeNavigation();

  const href = useMemo(() => {
    const search = searchParams.toString();
    return `${pathname ?? '/'}${search ? `?${search}` : ''}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    registerHref(href);
  }, [enabled, href, registerHref]);

  return null;
}
