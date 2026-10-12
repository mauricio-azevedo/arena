'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMemberProfileDrawer } from '../member-profile-drawer-context';

type MemberNameProps = {
  memberId: string;
  children: ReactNode;
  className?: string;
};

// A member's name inside a group context. Opens the group-scoped profile drawer
// for any member — real or stub — so both behave identically.
export function MemberName({ memberId, children, className }: MemberNameProps) {
  const { openMemberProfile } = useMemberProfileDrawer();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        openMemberProfile(memberId);
      }}
      className={cn('text-left underline-offset-4 hover:underline', className)}
    >
      {children}
    </button>
  );
}
