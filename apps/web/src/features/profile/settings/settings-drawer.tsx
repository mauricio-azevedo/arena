'use client';

import { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import type { ProfileUser } from '../types/profile-user.type';
import { EditProfileView, type EditedUser } from './edit-profile-view';
import { PasswordView } from './password-view';
import { SettingsMenuView } from './settings-menu-view';

export type { EditedUser };

type SettingsView = 'menu' | 'edit' | 'password';

// One unrouted bottom-sheet for all account actions. The content swaps between
// menu → edit → password via local state (the match-drawer pattern); the sheet is
// dismissed by swipe-down or scrim tap, so there's no URL/history involvement.
export function SettingsDrawer({
  open,
  onOpenChange,
  token,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  user: ProfileUser;
  onSaved: (user: EditedUser) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        {/* Remount on open so the view starts at the menu and forms seed fresh. */}
        {open && <SettingsViews token={token} user={user} onSaved={onSaved} />}
      </DrawerContent>
    </Drawer>
  );
}

function SettingsViews({
  token,
  user,
  onSaved,
}: {
  token: string;
  user: ProfileUser;
  onSaved: (user: EditedUser) => void;
}) {
  const [view, setView] = useState<SettingsView>('menu');
  const back = () => setView('menu');

  if (view === 'edit') {
    return <EditProfileView token={token} user={user} onBack={back} onSaved={onSaved} />;
  }

  if (view === 'password') {
    return <PasswordView token={token} onBack={back} />;
  }

  return <SettingsMenuView onEdit={() => setView('edit')} onPassword={() => setView('password')} />;
}
