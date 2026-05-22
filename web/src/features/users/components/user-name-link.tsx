'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getCurrentUserIdFromAccessToken } from '@/lib/auth';

type UserNameLinkVariant = 'default' | 'feed' | 'inline';

type Props = {
  userId?: string | null;
  children: ReactNode;
  className?: string;
  returnTo?: string;
  variant?: UserNameLinkVariant;
};

const inlineLinkClassName =
  'font-semibold text-secondary-foreground underline decoration-primary/35 decoration-1 underline-offset-[3px] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const linkVariantClassNames: Record<UserNameLinkVariant, string> = {
  default: 'underline-offset-4 hover:underline',
  feed: inlineLinkClassName,
  inline: inlineLinkClassName,
};

export function UserNameLink({ userId, children, className, returnTo, variant = 'default' }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getCurrentUserIdFromAccessToken(),
  );
  const [currentReturnTo, setCurrentReturnTo] = useState(() =>
    typeof window === 'undefined' ? '' : `${window.location.pathname}${window.location.search}`,
  );

  useEffect(() => {
    setCurrentUserId(getCurrentUserIdFromAccessToken());
    setCurrentReturnTo(`${window.location.pathname}${window.location.search}`);
  }, []);

  const href = useMemo(() => {
    if (!userId) {
      return '';
    }

    if (userId === currentUserId) {
      return '/profile';
    }

    const search = searchParams.toString();
    const fallbackReturnTo = `${pathname}${search ? `?${search}` : ''}`;
    const targetReturnTo = returnTo ?? currentReturnTo ?? fallbackReturnTo;

    return `/users/${userId}?returnTo=${encodeURIComponent(targetReturnTo)}`;
  }, [currentReturnTo, currentUserId, pathname, returnTo, searchParams, userId]);

  if (!userId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(linkVariantClassNames[variant], className)}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  );
}
