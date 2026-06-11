import { ArrowDown, ArrowUp, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserNameLink } from '@/features/users/components/user-name-link';
import { formatFeedItemTime } from '../helpers/feed-item-time.helper';
import type { FeedItem } from '../types/feed-item.type';
import type {
  RankingMovementFeedMetadata,
  RankingMovementFeedMovement,
  RankingMovementFeedPlayer,
} from '../types/ranking-movement-feed-metadata.type';

type Props = {
  item: FeedItem;
};

export function RankingMovementFeedCard({ item }: Props) {
  const metadata = item.metadata as RankingMovementFeedMetadata;
  const upMovements = metadata.movements.filter((movement) => movement.direction === 'UP');
  const downMovements = metadata.movements.filter((movement) => movement.direction === 'DOWN');
  const winnerScore = metadata.winnerTeam === 'TEAM_A' ? metadata.gamesA : metadata.gamesB;
  const loserScore = metadata.winnerTeam === 'TEAM_A' ? metadata.gamesB : metadata.gamesA;

  return (
    <Card className="br-pressable bg-gradient-to-br from-card via-card to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground ring-1 ring-primary/35">
            <Trophy className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 text-sm font-semibold leading-5 tracking-[-0.015em] text-foreground">
                {metadata.headline}
              </p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatFeedItemTime(item.occurredAt)}
              </p>
            </div>

            <div className="space-y-2">
              {upMovements.length > 0 && (
                <RankingMovementGroup label="Em alta" movements={upMovements} />
              )}
              {downMovements.length > 0 && (
                <RankingMovementGroup label="Em queda" movements={downMovements} />
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/55 px-3 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">
                <FeedPlayerNames players={metadata.winners} />
              </div>
              <div className="py-1 font-semibold text-foreground">
                {winnerScore}–{loserScore}
              </div>
              <div>
                <FeedPlayerNames players={metadata.losers} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RankingMovementGroup({
  label,
  movements,
}: {
  label: string;
  movements: RankingMovementFeedMovement[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="space-y-1">
        {movements.map((movement) => (
          <RankingMovementRow key={movement.groupMemberId} movement={movement} />
        ))}
      </div>
    </div>
  );
}

function RankingMovementRow({ movement }: { movement: RankingMovementFeedMovement }) {
  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const affectedText = getAffectedText(movement);

  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={
              isUp
                ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700'
                : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-700'
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <UserNameLink userId={movement.userId} variant="feed">
            {movement.displayName}
          </UserNameLink>
        </div>

        <div
          className={
            isUp
              ? 'shrink-0 text-sm font-semibold text-emerald-700'
              : 'shrink-0 text-sm font-semibold text-red-700'
          }
        >
          #{movement.previousRank} → #{movement.currentRank}
        </div>
      </div>

      {affectedText && (
        <p className="mt-1 pl-8 text-xs leading-5 text-muted-foreground">{affectedText}</p>
      )}
    </div>
  );
}

function getAffectedText(movement: RankingMovementFeedMovement) {
  if (movement.affectedMembers.length === 0) {
    return null;
  }

  const verb = movement.direction === 'UP' ? 'Passa' : 'Fica atrás de';
  const names = movement.affectedMembers.slice(0, 2).map((member) => member.displayName);
  const remainingCount = movement.affectedMembers.length - names.length;
  const listedNames = formatPlainNames(names);

  if (remainingCount <= 0) {
    return `${verb} ${listedNames}`;
  }

  return `${verb} ${listedNames} e mais ${remainingCount}`;
}

function formatPlainNames(names: string[]) {
  if (names.length <= 1) {
    return names[0] ?? '';
  }

  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

function FeedPlayerNames({ players }: { players: RankingMovementFeedPlayer[] }) {
  return (
    <>
      {players.map((player, index) => (
        <span key={player.groupMemberId}>
          {index > 0 && ' / '}
          <UserNameLink userId={player.userId} variant="feed">
            {player.displayName}
          </UserNameLink>
        </span>
      ))}
    </>
  );
}
