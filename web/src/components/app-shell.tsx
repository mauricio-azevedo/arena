import { BottomNav } from '@/components/bottom-nav';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pb-28 pt-5 text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent)_28%,transparent),transparent_38%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-background via-background/80 to-transparent" />

      <div className="mx-auto w-full max-w-md space-y-6">{children}</div>
      <BottomNav />
    </main>
  );
}
