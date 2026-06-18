import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  groupId: string;
  canManageMatches: boolean;
};

export function GroupActions({ groupId, canManageMatches }: Props) {
  if (!canManageMatches) {
    return null;
  }

  return (
    <Button asChild size="lg" className="h-12 w-full rounded-full font-semibold">
      <Link href={`/groups/${groupId}/matches/new`}>
        <Plus className="h-4 w-4" />
        Registrar partida
      </Link>
    </Button>
  );
}
