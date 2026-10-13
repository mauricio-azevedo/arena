'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GroupMember, GroupMemberRole } from '@/types/api';
import { MemberProfileDrawer } from './member-profile-drawer';

type MemberProfileDrawerContextValue = {
  openMemberProfile: (memberId: string) => void;
};

// No-op default so a name is safe to render outside a provider; only surfaces
// inside a group (ranking, matches) mount the actual drawer.
const MemberProfileDrawerContext = createContext<MemberProfileDrawerContextValue>({
  openMemberProfile: () => {},
});

export function useMemberProfileDrawer() {
  return useContext(MemberProfileDrawerContext);
}

type MemberProfileDrawerProviderProps = {
  groupId: string;
  groupName: string;
  ranking: GroupMember[];
  // The viewer's role in this group; gates the admin-only stub shortcuts.
  viewerRole?: GroupMemberRole | null;
  children: ReactNode;
};

export function MemberProfileDrawerProvider({
  groupId,
  groupName,
  ranking,
  viewerRole = null,
  children,
}: MemberProfileDrawerProviderProps) {
  // A fresh key each open remounts the drawer content so it refetches — even when
  // reopening the same member (vaul keeps content mounted across open/close).
  const seq = useRef(0);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ memberId: string; key: number } | null>(null);

  // Display rank comes from the live ranking order (stored currentRank can lag).
  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    ranking.forEach((member, index) => map.set(member.id, index + 1));
    return map;
  }, [ranking]);

  const openMemberProfile = useCallback((id: string) => {
    seq.current += 1;
    setTarget({ memberId: id, key: seq.current });
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openMemberProfile }), [openMemberProfile]);

  return (
    <MemberProfileDrawerContext.Provider value={value}>
      {children}
      <MemberProfileDrawer
        open={open}
        groupId={groupId}
        groupName={groupName}
        totalMembers={ranking.length}
        viewerRole={viewerRole}
        target={target}
        rank={target ? rankById.get(target.memberId) : undefined}
        onClose={() => setOpen(false)}
      />
    </MemberProfileDrawerContext.Provider>
  );
}
