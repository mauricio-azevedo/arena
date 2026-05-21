import type { ProfileMatchPlayer } from '@/features/profile/tabs/summary/types/profile-summary-match.type';
import { UserNameLink } from '@/features/users/components/user-name-link';

type Props = {
  players: ProfileMatchPlayer[];
};

export function ProfileMatchPlayersInline({ players }: Props) {
  if (players.length === 0) {
    return <>Dupla não encontrada</>;
  }

  return (
    <>
      {players.map((player, index) => (
        <span key={`${player.userId}-${index}`}>
          {index > 0 && ' / '}
          <UserNameLink userId={player.userId}>{player.displayName}</UserNameLink>
        </span>
      ))}
    </>
  );
}
