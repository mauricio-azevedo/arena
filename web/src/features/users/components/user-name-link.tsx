'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getCurrentUserIdFromAccessToken } from '@/lib/auth';

type Props = {
  userId?: string | null;
  children: ReactNode;
  className?: string;
};

export function UserNameLink({ userId, children, className }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserIdFromAccessToken());
  }, []);

  if (!userId || userId === currentUserId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={`/users/${userId}`}
      className={cn('underline-offset-4 hover:underline', className)}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  );
}
