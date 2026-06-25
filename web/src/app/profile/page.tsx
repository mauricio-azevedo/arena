'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function ProfilePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The gear only makes sense signed in; ProfileScreen reports this once it reads
  // the token (and again after a post-auth reload), so the header stays in sync.
  const [signedIn, setSignedIn] = useState(false);

  return (
    <AppShell
      chrome={{
        bottomNav: true,
        header: (
          <ProfileHeader onOpenSettings={signedIn ? () => setSettingsOpen(true) : undefined} />
        ),
      }}
    >
      <ProfileScreen
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        onSignedInChange={setSignedIn}
      />
    </AppShell>
  );
}
