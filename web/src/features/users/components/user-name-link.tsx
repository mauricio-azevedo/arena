'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getCurrentUserIdFromAccessToken } from '@/lib/auth';

type Props = {
  userId?: string | null;
  children: ReactNode;
  className?: string;
  returnTo?: string;
};

export function UserNameLink({ userId, children, className, returnTo }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserIdFromAccessToken());
  }, []);

  const href = useMemo(() => {
    if (!userId) {
      return '';
    }

    const search = searchParams.toString();
    const fallbackReturnTo = `${pathname}${search ? `?${search}` : ''}`;
    const targetReturnTo = returnTo ?? fallbackReturnTo;

    return `/users/${userId}?returnTo=${encodeURIComponent(targetReturnTo)}`;
  }, [pathname, returnTo, searchParams, userId]);

  if (!userId || userId === currentUserId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={href}
      className={cn('underline-offset-4 hover:underline', className)}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  );
}
