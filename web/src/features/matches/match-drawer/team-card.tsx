import { Check, Minus, Plus, X } from 'lucide-react';
import { Label, Meta, Overline, Stat } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { TOUCH_TARGET_48 } from '@/lib/touch-target';
import { avatarBgClass, type ResolvedPlayer } from './match-player.helpers';
import type { SlotKey, Slots } from './use-match-form';

type TeamCardProps = {
  label: string;
  slotKeys: [SlotKey, SlotKey];
  slots: Slots;
  score: number;
  isWinner: boolean;
  hasWinner: boolean;
  currentMembershipId: string | null;
  resolve: (id: string) => ResolvedPlayer | undefined;
  rankOf: (id: string) => number | undefined;
  onAddSlot: (slot: SlotKey) => void;
  onRemoveSlot: (slot: SlotKey) => void;
  onStep: (delta: number) => void;
  minGames: number;
  maxGames: number;
};

export function TeamCard({
  label,
  slotKeys,
  slots,
  score,
  isWinner,
  hasWinner,
  currentMembershipId,
  resolve,
  rankOf,
  onAddSlot,
  onRemoveSlot,
  onStep,
  minGames,
  maxGames,
}: TeamCardProps) {
  const scoreColor = isWinner
    ? 'text-brand'
    : hasWinner
      ? 'text-muted-foreground'
      : 'text-foreground';

  return (
    <div
      className={cn(
        'rounded-card p-4 shadow-card ring-2 ring-transparent',
        isWinner ? 'bg-brand/10 ring-brand' : 'bg-surface',
      )}
    >
      <div className="flex items-center justify-between">
        <Overline className="text-faint-foreground">{label}</Overline>
        <span
          aria-hidden={!isWinner}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg bg-brand/20 px-2 py-1 text-brand',
            !isWinner && 'invisible',
          )}
        >
          <Check className="size-3" strokeWidth={3} aria-hidden />
          <Overline className="text-brand">Venceu</Overline>
        </span>
      </div>

      <div>
        {slotKeys.map((slotKey, index) => {
          const memberId = slots[slotKey];
          const player = memberId ? resolve(memberId) : undefined;
          const showDivider = index > 0;

          if (!player) {
            return (
              <button
                key={slotKey}
                type="button"
                onClick={() => onAddSlot(slotKey)}
                className={cn(
                  'flex w-full items-center gap-3 py-2.5 text-left transition-transform active:scale-[0.99]',
                  showDivider && 'border-t border-divider',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-border-accent text-faint-foreground">
                  <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden />
                </span>
                <Label className="text-faint-foreground">Adicionar jogador</Label>
              </button>
            );
          }

          const rank = rankOf(player.id);
          const isYou = player.id === currentMembershipId;

          return (
            <div
              key={slotKey}
              className={cn(
                'flex items-center gap-3 py-2.5',
                showDivider && 'border-t border-divider',
              )}
            >
              <Meta
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--border)]',
                  avatarBgClass(player.avatarSeed),
                  isYou ? 'text-brand' : 'text-muted-foreground',
                )}
                aria-hidden
              >
                {player.initial}
              </Meta>

              <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <Label className="truncate text-foreground">{player.fullName}</Label>
                {rank !== undefined && (
                  <Meta className="shrink-0 text-faint-foreground">#{rank}</Meta>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemoveSlot(slotKey)}
                aria-label={`Remover ${player.firstName}`}
                className={cn(
                  'flex size-[30px] shrink-0 items-center justify-center rounded-full text-faint-foreground transition-transform active:scale-90 hover:text-foreground',
                  TOUCH_TARGET_48,
                )}
              >
                <X className="size-[17px]" strokeWidth={2.4} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-divider pt-3.5">
        <Label className="text-muted-foreground">Games</Label>
        <div className="flex items-center gap-4">
          <StepButton
            label={`Diminuir games da ${label}`}
            disabled={score <= minGames}
            onClick={() => onStep(-1)}
          >
            <Minus className="size-[18px]" strokeWidth={2.6} aria-hidden />
          </StepButton>

          <Stat size="xl" className={cn('min-w-7 text-center', scoreColor)}>
            {score}
          </Stat>

          <StepButton
            label={`Aumentar games da ${label}`}
            disabled={score >= maxGames}
            onClick={() => onStep(1)}
          >
            <Plus className="size-[18px]" strokeWidth={2.6} aria-hidden />
          </StepButton>
        </div>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-[38px] items-center justify-center rounded-full bg-surface text-foreground shadow-[inset_0_0_0_1px_var(--border-accent)] transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100',
        TOUCH_TARGET_48,
      )}
    >
      {children}
    </button>
  );
}
