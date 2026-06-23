import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { cn } from '@/lib/utils';

type MemberAvatarProps = {
  // null → jogador sem conta (convidado): a faceless dashed ring instead of a colored
  // avatar, so a stub reads the same everywhere (ranking, matches, drawers).
  userId: string | null;
  name: string;
  // Stable id → deterministic fill color for real members. Omit when `realClassName`
  // supplies the background (e.g. the match card's team palette).
  seed?: string;
  // Sizing + overrides applied in both states (e.g. size-[38px], text color).
  className?: string;
  // Appearance applied to real members only (background/text) — ignored for stubs.
  realClassName?: string;
};

// Single source of truth for how a group member's avatar looks, including the stub
// (convidado) treatment. Use this wherever a member avatar appears.
export function MemberAvatar({ userId, name, seed, className, realClassName }: MemberAvatarProps) {
  const isStub = userId === null;

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-extrabold',
        isStub
          ? 'border border-dashed border-border-accent text-muted-foreground'
          : cn(
              'text-foreground shadow-[inset_0_0_0_1px_var(--border)]',
              seed && avatarBgClass(seed),
              realClassName,
            ),
        className,
      )}
    >
      {nameInitial(name)}
    </span>
  );
}
