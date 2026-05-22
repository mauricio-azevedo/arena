import type { ProfileMatchPlayer } from '@/features/profile/tabs/summary/types/profile-summary-match.type';
import { UserNameLink } from '@/features/users/components/user-name-link';

type Props = {
  players: ProfileMatchPlayer[];
  separator?: string;
  variant?: 'default' | 'inline';
};

export function ProfileMatchPlayersInline({ players, separator = ' / ', variant = 'default' }: Props) {
  if (players.length === 0) {
    return <>Dupla não encontrada</>;
  }

  return (
    <>
      {players.map((player, index) => (
        <span key={`${player.userId}-${index}`}>
          {index > 0 && separator}
          <UserNameLink userId={player.userId} variant={variant}>
            {player.displayName}
          </UserNameLink>
        </span>
      ))}
    </>
  );
}
