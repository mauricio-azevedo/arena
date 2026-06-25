'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function ProfilePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <AppShell
      chrome={{
        bottomNav: true,
        header: <ProfileHeader onOpenSettings={() => setSettingsOpen(true)} />,
      }}
    >
      <ProfileScreen settingsOpen={settingsOpen} onSettingsOpenChange={setSettingsOpen} />
    </AppShell>
  );
}
