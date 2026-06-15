import Link from 'next/link';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  groupId: string;
  isAdmin: boolean;
  canManageMatches: boolean;
};

export function GroupActions({ groupId, isAdmin, canManageMatches }: Props) {
  if (!canManageMatches) {
    return null;
  }

  return (
    <div className={isAdmin ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
      <Button asChild size="lg" className="h-12 rounded-full font-semibold">
        <Link href={`/groups/${groupId}/matches/new`}>
          <Plus className="h-4 w-4" />
          Registrar partida
        </Link>
      </Button>

      {isAdmin && (
        <Button asChild variant="secondary" size="lg" className="h-12 rounded-full font-semibold">
          <Link href={`/groups/${groupId}/invite`}>
            <UserPlus className="h-4 w-4" />
            Convidar
          </Link>
        </Button>
      )}
    </div>
  );
}
