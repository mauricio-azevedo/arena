'use client';

import { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import type { AuthDrawerView, AuthNotice } from '../auth-drawer-provider';
import { AuthLoginView } from './auth-login-view';
import { AuthSignupView } from './auth-signup-view';

// One unrouted bottom-sheet for both auth flows. The content swaps between login ↔
// signup via local state (the settings/match-drawer pattern); the sheet is dismissed
// by swipe-down or scrim tap, so there's no URL/history involvement.
export function AuthDrawer({
  open,
  view,
  notice,
  onOpenChange,
  onAuthenticated,
}: {
  open: boolean;
  view: AuthDrawerView;
  notice?: AuthNotice | null;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="fit" aria-describedby={undefined}>
        {/* Remount on open so the view starts where the caller asked and forms seed fresh. */}
        {open && <AuthViews initialView={view} notice={notice} onAuthenticated={onAuthenticated} />}
      </DrawerContent>
    </Drawer>
  );
}

function AuthViews({
  initialView,
  notice,
  onAuthenticated,
}: {
  initialView: AuthDrawerView;
  notice?: AuthNotice | null;
  onAuthenticated: () => void;
}) {
  const [view, setView] = useState<AuthDrawerView>(initialView);

  if (view === 'signup') {
    return (
      <AuthSignupView onAuthenticated={onAuthenticated} onSwitchToLogin={() => setView('login')} />
    );
  }

  // The notice (e.g. "session expired") only belongs on the login view.
  return (
    <AuthLoginView
      notice={notice}
      onAuthenticated={onAuthenticated}
      onSwitchToSignup={() => setView('signup')}
    />
  );
}
