'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getCurrentUserIdFromAccessToken } from '@/lib/auth';

type UserNameLinkVariant = 'default' | 'feed' | 'inline';

type Props = {
  userId?: string | null;
  children: ReactNode;
  className?: string;
  variant?: UserNameLinkVariant;
};

const linkVariantClassNames: Record<UserNameLinkVariant, string> = {
  default: 'underline-offset-4 hover:underline',
  feed: 'font-semibold underline-offset-4 hover:underline',
  inline: 'font-semibold underline-offset-4 hover:underline',
};

export function UserNameLink({ userId, children, className, variant = 'default' }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getCurrentUserIdFromAccessToken(),
  );

  useEffect(() => {
    setCurrentUserId(getCurrentUserIdFromAccessToken());
  }, []);

  const href = useMemo(() => {
    if (!userId) {
      return '';
    }

    if (userId === currentUserId) {
      return '/profile';
    }

    return `/users/${userId}`;
  }, [currentUserId, userId]);

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
