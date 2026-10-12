'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GroupMember, Match } from '@/types/api';
import { MatchDrawer, type MatchDrawerTarget } from './match-drawer';

type MatchDrawerContextValue = {
  openCreate: () => void;
  openEdit: (match: Match) => void;
};

// No-op default so consumers (e.g. a match card) are safe to call outside a
// provider — only group detail mounts the actual drawer.
const MatchDrawerContext = createContext<MatchDrawerContextValue>({
  openCreate: () => {},
  openEdit: () => {},
});

export function useMatchDrawer() {
  return useContext(MatchDrawerContext);
}

type MatchDrawerProviderProps = {
  groupId: string;
  groupName: string;
  members: GroupMember[];
  ranking: GroupMember[];
  currentMembershipId: string | null;
  onSaved: () => void;
  autoOpenCreate?: boolean;
  children: ReactNode;
};

export function MatchDrawerProvider({
  groupId,
  groupName,
  members,
  ranking,
  currentMembershipId,
  onSaved,
  autoOpenCreate = false,
  children,
}: MatchDrawerProviderProps) {
  const seq = useRef(autoOpenCreate ? 1 : 0);
  const [open, setOpen] = useState(autoOpenCreate);
  const [target, setTarget] = useState<MatchDrawerTarget | null>(
    autoOpenCreate ? { mode: 'create', key: 0 } : null,
  );

  // The target is kept after close so the sheet still has content to render
  // during its slide-down animation; a fresh `key` each open remounts the form.
  const openCreate = useCallback(() => {
    seq.current += 1;
    setTarget({ mode: 'create', key: seq.current });
    setOpen(true);
  }, []);

  const openEdit = useCallback((match: Match) => {
    seq.current += 1;
    setTarget({ mode: 'edit', key: seq.current, match });
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  return (
    <MatchDrawerContext.Provider value={value}>
      {children}
      <MatchDrawer
        open={open}
        target={target}
        groupId={groupId}
        groupName={groupName}
        members={members}
        ranking={ranking}
        currentMembershipId={currentMembershipId}
        onClose={() => setOpen(false)}
        onSaved={onSaved}
      />
    </MatchDrawerContext.Provider>
  );
}
