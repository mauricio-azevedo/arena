'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSafeNavigation } from '@/providers/navigation-provider';

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registerHref } = useSafeNavigation();

  const href = useMemo(() => {
    const search = searchParams.toString();
    return `${pathname ?? '/'}${search ? `?${search}` : ''}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    registerHref(href);
  }, [href, registerHref]);

  return null;
}
