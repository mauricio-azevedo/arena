import { ArrowDown, ArrowUp, Trophy, X } from 'lucide-react';
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

const EMPHASIZED_HEADLINE_WORDS = /\b(dispara|disparam|desaba|desabam)\b/gi;

export function RankingMovementFeedCard({ item }: Props) {
  const metadata = item.metadata as RankingMovementFeedMetadata;
  const winnerScore = metadata.winnerTeam === 'TEAM_A' ? metadata.gamesA : metadata.gamesB;
  const loserScore = metadata.winnerTeam === 'TEAM_A' ? metadata.gamesB : metadata.gamesA;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Trophy className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-foreground">
                <HighlightedHeadline headline={metadata.headline} />
              </p>
              <p className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                {formatFeedItemTime(item.occurredAt)}
              </p>
            </div>

            <div className="space-y-2">
              {metadata.movements.map((movement) => (
                <RankingMovementRow
                  key={movement.groupMemberId}
                  movement={movement}
                  showAffectedText={metadata.movements.length === 1}
                />
              ))}
            </div>

            <RankingMovementScoreboard
              winners={metadata.winners}
              losers={metadata.losers}
              winnerScore={winnerScore}
              loserScore={loserScore}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HighlightedHeadline({ headline }: { headline: string }) {
  const parts = headline.split(EMPHASIZED_HEADLINE_WORDS);

  return (
    <>
      {parts.map((part, index) => {
        const shouldEmphasize = EMPHASIZED_HEADLINE_WORDS.test(part);
        EMPHASIZED_HEADLINE_WORDS.lastIndex = 0;

        if (!shouldEmphasize) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <span key={`${part}-${index}`} className="font-semibold">
            {part}
          </span>
        );
      })}
    </>
  );
}

function RankingMovementRow({
  movement,
  showAffectedText,
}: {
  movement: RankingMovementFeedMovement;
  showAffectedText: boolean;
}) {
  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const affectedText = showAffectedText ? getAffectedText(movement) : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <UserNameLink userId={movement.userId} variant="feed">
            {movement.displayName}
          </UserNameLink>
        </div>

        <div className="shrink-0 text-sm font-medium">
          #{movement.previousRank} → #{movement.currentRank}
        </div>
      </div>

      {affectedText && <p className="pl-8 text-xs leading-5 text-muted-foreground">{affectedText}</p>}
    </div>
  );
}

function RankingMovementScoreboard({
  winners,
  losers,
  winnerScore,
  loserScore,
}: {
  winners: RankingMovementFeedPlayer[];
  losers: RankingMovementFeedPlayer[];
  winnerScore: number;
  loserScore: number;
}) {
  return (
    <div className="px-3 py-2 text-sm text-muted-foreground">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
        <div className="min-w-0 font-medium text-foreground">
          <FeedPlayerNames players={winners} />
        </div>
        <div className="text-right text-lg font-semibold leading-none text-foreground">{winnerScore}</div>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <X className="h-3.5 w-3.5" />
        </div>
        <div aria-hidden="true" />

        <div className="min-w-0">
          <FeedPlayerNames players={losers} />
        </div>
        <div className="text-right text-lg font-semibold leading-none text-foreground">{loserScore}</div>
      </div>
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
