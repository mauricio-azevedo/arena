import type { ReactNode } from 'react';

// The fixed, blurred top-bar shell shared by every screen header (the title bar,
// the home greeting, the profile gear). Owns the position, safe-area, and the
// bottom-fading backdrop blur; callers provide the `max-w-md` content row inside.
export function AppHeaderShell({ children }: { children: ReactNode }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-xs [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent)] [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" />
      {children}
    </header>
  );
}
