'use client';

import { useMemo, useState } from 'react';
import type { GroupMember, Match } from '@/types/api';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Body, Label, Meta } from '@/components/ui/text';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createGroupMatch, updateGroupMatch } from '@/features/matches/api/matches.api';
import { getAccessToken } from '@/lib/auth';
import { ComposeView } from './compose-view';
import { PickerView, type PickerEntry } from './picker-view';
import { TeamCard } from './team-card';
import { buildPlayerLookup, resolveFromMember } from './match-player.helpers';
import { SLOT_SUBLABELS, useMatchForm, type SlotKey } from './use-match-form';

export type MatchDrawerTarget =
  | { mode: 'create'; key: number }
  | { mode: 'edit'; key: number; match: Match };

type MatchDrawerProps = {
  open: boolean;
  target: MatchDrawerTarget | null;
  groupId: string;
  groupName: string;
  members: GroupMember[];
  ranking: GroupMember[];
  currentMembershipId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function MatchDrawer({
  open,
  target,
  groupId,
  groupName,
  members,
  ranking,
  currentMembershipId,
  onClose,
  onSaved,
}: MatchDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DrawerContent aria-describedby={undefined}>
        {target && (
          <MatchComposer
            key={target.key}
            mode={target.mode}
            match={target.mode === 'edit' ? target.match : undefined}
            groupId={groupId}
            groupName={groupName}
            members={members}
            ranking={ranking}
            currentMembershipId={currentMembershipId}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

type MatchComposerProps = {
  mode: 'create' | 'edit';
  match?: Match;
  groupId: string;
  groupName: string;
  members: GroupMember[];
  ranking: GroupMember[];
  currentMembershipId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

function MatchComposer({
  mode,
  match,
  groupId,
  groupName,
  members,
  ranking,
  currentMembershipId,
  onClose,
  onSaved,
}: MatchComposerProps) {
  const form = useMatchForm(match);

  const [view, setView] = useState<'compose' | 'picker'>('compose');
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useMemo(() => buildPlayerLookup(members, match), [members, match]);

  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    ranking.forEach((member, index) => map.set(member.id, index + 1));
    return map;
  }, [ranking]);

  const pool = useMemo<PickerEntry[]>(
    () =>
      members
        .filter((member) => member.leftAt === null)
        .map((member) => {
          const resolved = resolveFromMember(member);
          return {
            id: member.id,
            firstName: resolved.firstName,
            fullName: resolved.fullName,
            initial: resolved.initial,
            avatarSeed: resolved.avatarSeed,
            rank: rankById.get(member.id),
            rating: member.rating,
            isYou: member.id === currentMembershipId,
          };
        })
        .sort((a, b) => b.rating - a.rating),
    [members, rankById, currentMembershipId],
  );

  const blocked = mode === 'create' && pool.length < 4;

  function openPicker(slot: SlotKey) {
    setActiveSlot(slot);
    setView('picker');
  }

  function handleSelect(memberId: string) {
    if (activeSlot) {
      form.assign(activeSlot, memberId);
    }

    setActiveSlot(null);
    setView('compose');
  }

  async function handleSave() {
    if (!form.canSave || isSubmitting) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError('Entre na sua conta para registrar uma partida.');
      return;
    }

    const input = {
      teamAPlayer1Id: form.slots.a1 as string,
      teamAPlayer2Id: form.slots.a2 as string,
      teamBPlayer1Id: form.slots.b1 as string,
      teamBPlayer2Id: form.slots.b2 as string,
      gamesA: form.scoreA,
      gamesB: form.scoreB,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'edit' && match) {
        await updateGroupMatch(token, groupId, match.id, input);
      } else {
        await createGroupMatch(token, groupId, input);
      }

      onSaved();
      onClose();
    } catch {
      setError('Não foi possível salvar. Verifique se você faz parte deste grupo.');
      setIsSubmitting(false);
    }
  }

  if (view === 'picker' && activeSlot) {
    const currentId = form.slots[activeSlot];

    return (
      <PickerView
        sublabel={SLOT_SUBLABELS[activeSlot]}
        pool={pool}
        currentId={currentId}
        takenIds={form.selectedIds.filter((id) => id !== currentId)}
        onSelect={handleSelect}
        onBack={() => setView('compose')}
      />
    );
  }

  return (
    <ComposeView
      title={mode === 'edit' ? 'Corrigir partida' : 'Nova partida'}
      groupName={groupName}
      saveLabel={mode === 'edit' ? 'Salvar correção' : 'Salvar partida'}
      canSave={form.canSave}
      isSubmitting={isSubmitting}
      error={error}
      onCancel={onClose}
      onSave={handleSave}
    >
      {blocked ? (
        <div className="mt-2 rounded-card bg-surface p-4 shadow-hairline">
          <Label className="block text-foreground">Poucos jogadores no grupo</Label>
          <Body className="mt-1 text-muted-foreground">
            É preciso ter pelo menos 4 membros ativos para registrar uma partida.
          </Body>
        </div>
      ) : (
        <>
          <TeamCard
            label="Dupla A"
            slotKeys={['a1', 'a2']}
            slots={form.slots}
            score={form.scoreA}
            isWinner={form.winner === 'A'}
            hasWinner={form.validScore}
            currentMembershipId={currentMembershipId}
            resolve={(id) => lookup.get(id)}
            rankOf={(id) => rankById.get(id)}
            onAddSlot={openPicker}
            onRemoveSlot={form.clear}
            onStep={form.stepA}
            minGames={form.minGames}
            maxGames={form.maxGames}
          />

          <div className="my-3.5 flex items-center gap-3 px-0.5">
            <div className="h-px flex-1 bg-divider" />
            <Meta className="font-extrabold tracking-[0.15em] text-faint-foreground">VS</Meta>
            <div className="h-px flex-1 bg-divider" />
          </div>

          <TeamCard
            label="Dupla B"
            slotKeys={['b1', 'b2']}
            slots={form.slots}
            score={form.scoreB}
            isWinner={form.winner === 'B'}
            hasWinner={form.validScore}
            currentMembershipId={currentMembershipId}
            resolve={(id) => lookup.get(id)}
            rankOf={(id) => rankById.get(id)}
            onAddSlot={openPicker}
            onRemoveSlot={form.clear}
            onStep={form.stepB}
            minGames={form.minGames}
            maxGames={form.maxGames}
          />

          <div className="mt-4 flex items-start gap-1.5 px-1">
            <Info
              className={cn(
                'mt-px size-[15px] shrink-0',
                form.helperWarn ? 'text-tag-warn' : 'text-faint-foreground',
              )}
              strokeWidth={2.2}
              aria-hidden
            />
            <Meta
              className={cn(
                'leading-[1.45] font-semibold',
                form.helperWarn ? 'text-tag-warn' : 'text-faint-foreground',
              )}
            >
              {form.helperText}
            </Meta>
          </div>
        </>
      )}
    </ComposeView>
  );
}
