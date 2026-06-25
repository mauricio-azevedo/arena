'use client';

import { Settings } from 'lucide-react';
import { AppHeaderShell } from '@/components/app-header-shell';

// Fixed, blurred top bar for the profile tab — same shell as the home header
// (`AppShell` chrome.header). Holds only the settings gear, right-aligned, per the
// design; the identity hero below already names the user, so there's no title.
export function ProfileHeader({ onOpenSettings }: { onOpenSettings?: () => void }) {
  return (
    <AppHeaderShell>
      <div className="relative mx-auto flex h-11 w-full max-w-md items-center justify-end">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Configurações"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-foreground shadow-hairline transition-transform active:scale-95"
          >
            <Settings className="size-[1.125rem]" strokeWidth={2.2} aria-hidden />
          </button>
        )}
      </div>
    </AppHeaderShell>
  );
}
