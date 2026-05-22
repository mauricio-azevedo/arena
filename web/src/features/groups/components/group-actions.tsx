import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  groupId: string;
  isAdmin: boolean;
};

export function GroupActions({ groupId, isAdmin }: Props) {
  return (
    <div className={isAdmin ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
      <Button asChild size="lg">
        <Link href={`/groups/${groupId}/matches/new`}>Nova partida</Link>
      </Button>

      {isAdmin && (
        <Button asChild variant="outline" size="lg">
          <Link href={`/groups/${groupId}/invite`}>Convidar</Link>
        </Button>
      )}
    </div>
  );
}
