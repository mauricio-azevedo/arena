import { useMemo, useState } from 'react';
import { Check, ChevronLeft, Search } from 'lucide-react';
import { Label, Meta, Overline } from '@/components/ui/text';
import { DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { TOUCH_TARGET_48 } from '@/lib/touch-target';
import { avatarBgClass } from './match-player.helpers';

export type PickerEntry = {
  id: string;
  firstName: string;
  fullName: string;
  initial: string;
  avatarSeed: string;
  rank?: number;
  rating: number;
  isYou: boolean;
};

type PickerViewProps = {
  sublabel: string;
  pool: PickerEntry[];
  currentId: string | null;
  takenIds: string[];
  onSelect: (memberId: string) => void;
  onBack: () => void;
};

export function PickerView({
  sublabel,
  pool,
  currentId,
  takenIds,
  onSelect,
  onBack,
}: PickerViewProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return pool;
    }

    return pool.filter((entry) => entry.fullName.toLowerCase().includes(query));
  }, [pool, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[52px] shrink-0 items-center justify-between px-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'flex min-w-16 items-center gap-0.5 text-brand transition-opacity active:opacity-60',
            TOUCH_TARGET_48,
          )}
        >
          <ChevronLeft className="size-[22px]" strokeWidth={2.4} aria-hidden />
          <Label className="text-brand">Voltar</Label>
        </button>

        <div className="text-center">
          <DrawerTitle>Escolher jogador</DrawerTitle>
          <Meta className="text-faint-foreground">{sublabel}</Meta>
        </div>

        <div className="w-16" />
      </div>

      <div className="shrink-0 px-[18px] pb-3 pt-1">
        <div className="flex h-[46px] items-center gap-2.5 rounded-pill bg-surface px-4 shadow-hairline">
          <Search
            className="size-[18px] shrink-0 text-faint-foreground"
            strokeWidth={2.2}
            aria-hidden
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar membro do grupo"
            className="min-w-0 flex-1 bg-transparent text-body font-semibold text-foreground outline-none placeholder:text-faint-foreground"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[30px] [scrollbar-width:none]">
        {filtered.length > 0 ? (
          <div className="overflow-hidden rounded-3xl bg-surface shadow-hairline">
            {filtered.map((entry) => {
              const checked = entry.id === currentId;
              const taken = !checked && takenIds.includes(entry.id);

              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={taken}
                  onClick={() => onSelect(entry.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-t border-divider px-4 py-3 text-left first:border-t-0',
                    taken && 'opacity-40',
                    checked && 'bg-brand/15',
                  )}
                >
                  <Meta
                    className={cn(
                      'flex size-[42px] shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--border)]',
                      avatarBgClass(entry.avatarSeed),
                      entry.isYou ? 'text-brand' : 'text-muted-foreground',
                    )}
                    aria-hidden
                  >
                    {entry.initial}
                  </Meta>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 items-end gap-2">
                      <Label className="truncate text-foreground">{entry.fullName}</Label>
                      {entry.isYou && (
                        <span className="shrink-0 rounded-md bg-brand/20 px-1.5 py-px text-brand">
                          <Overline size="xs" className="text-brand">
                            Você
                          </Overline>
                        </span>
                      )}
                    </div>
                    <Meta className="text-muted-foreground">
                      {entry.rank !== undefined ? `#${entry.rank} · ` : ''}
                      {Math.round(entry.rating)} pts
                    </Meta>
                  </div>

                  {checked && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                  {taken && <Meta className="shrink-0 text-faint-foreground">Na partida</Meta>}
                </button>
              );
            })}
          </div>
        ) : (
          <Meta className="mt-7 block text-center text-faint-foreground">
            Nenhum jogador encontrado.
          </Meta>
        )}
      </div>
    </div>
  );
}
