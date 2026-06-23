import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Body, Label, Meta, Overline, Stat, Title } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { nameInitial } from '@/lib/avatar';
import type { ClaimAdmin, SharedMatch } from '@/types/api';
import { DashedAvatar, GroupBrandChip } from './claim-shared';

type ClaimConflictProps = {
  groupId: string;
  groupName: string;
  stubName: string;
  sharedMatches: SharedMatch[];
  admins: ClaimAdmin[];
};

export function ClaimConflict({
  groupId,
  groupName,
  stubName,
  sharedMatches,
  admins,
}: ClaimConflictProps) {
  const sharedLabel =
    sharedMatches.length > 1 ? 'Partidas em comum' : 'A partida em comum';

  return (
    <div className="flex flex-col gap-7 py-2">
      <GroupBrandChip groupName={groupName} />

      <div className="flex flex-col items-center gap-4 text-center">
        <DashedAvatar initial={nameInitial(stubName)} className="size-[88px] text-stat-xl" />
        <div className="space-y-2">
          <Title className="text-balance text-foreground">
            Vocês já jogaram a mesma partida
          </Title>
          <Body className="mx-auto max-w-[20rem] text-muted-foreground">
            Você e o perfil <span className="font-bold text-foreground">{stubName}</span> já
            apareceram juntos em quadra. Como ninguém joga dos dois lados de um mesmo jogo, este
            perfil não pode ser seu.
          </Body>
        </div>
      </div>

      <div className="space-y-2.5">
        <Overline size="xs" className="px-0.5 text-faint-foreground">
          {sharedLabel}
        </Overline>
        <div className="space-y-2.5">
          {sharedMatches.map((match) => (
            <SharedMatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>

      <Meta className="block text-center text-faint-foreground">
        Sua conta continua como está — nada muda no seu histórico.
      </Meta>

      {admins.length > 0 && (
        <div className="space-y-3 text-center">
          <Meta className="mx-auto block max-w-[18rem] text-faint-foreground">
            Se alguma dessas partidas foi registrada por engano, fale com um admin do grupo.
          </Meta>
          <div className="flex flex-wrap justify-center gap-2">
            {admins.map((admin) => (
              <span
                key={admin.groupMemberId}
                className="flex items-center gap-2 rounded-pill bg-surface py-1.5 pl-1.5 pr-3.5 shadow-hairline"
              >
                <span
                  className="flex size-7 items-center justify-center rounded-full bg-avatar-1 font-display text-meta text-foreground"
                  aria-hidden
                >
                  {nameInitial(admin.name)}
                </span>
                <Label className="text-foreground">{admin.name}</Label>
              </span>
            ))}
          </div>
        </div>
      )}

      <Button asChild size="lg" variant="secondary" className="w-full">
        <Link href={`/groups/${groupId}`}>Voltar ao grupo</Link>
      </Button>
    </div>
  );
}

function SharedMatchCard({ match }: { match: SharedMatch }) {
  const date = new Date(match.playedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="rounded-3xl bg-surface px-4 py-3.5 shadow-hairline">
      <Meta className="mb-3 block text-muted-foreground">{date}</Meta>
      <div className="space-y-2.5">
        {match.teams.map((team) => (
          <div key={team.team} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {team.players.map((player, index) => (
                <span key={`${player.name}-${index}`} className="truncate">
                  {index > 0 && <span className="text-faint-foreground"> &amp; </span>}
                  <Label
                    className={cn(
                      player.isYou
                        ? 'text-brand'
                        : player.isStub
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                    )}
                  >
                    {player.name}
                  </Label>
                </span>
              ))}
            </div>
            <Stat
              size="sm"
              className={team.won ? 'text-brand' : 'text-faint-foreground'}
            >
              {team.score}
            </Stat>
          </div>
        ))}
      </div>
    </div>
  );
}
