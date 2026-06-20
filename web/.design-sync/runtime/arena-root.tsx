import * as React from 'react';

/**
 * Preview root for the Arena design system.
 *
 * The product ships dark-first (`.dark` on <body>) and loads Plus Jakarta Sans
 * via next/font. Neither exists in the isolated preview frame, so this wrapper
 * re-establishes both: the `.dark` class switches the token set to the approved
 * Arena look, and `font-sans` + the painted surface match the app shell.
 * Wired as cfg.provider so every card — authored or floor — renders on-brand.
 */
export function ArenaRoot({ children }: { children?: React.ReactNode }) {
  // Radix overlays (Dialog, Popover, DropdownMenu, Select…) portal to <body>,
  // outside this wrapper — promote the dark token set to <html> so portaled
  // content stays on-brand too.
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);
  return (
    <div
      className="dark font-sans bg-background text-foreground"
      style={{ minHeight: '100%', padding: '24px' }}
    >
      {/* Paint the frame itself dark so cards size to their content without a
          white gutter; #181920 is the dark --background. */}
      <style>{'html,body{margin:0;background:#181920;color-scheme:dark;}'}</style>
      {children}
    </div>
  );
}
