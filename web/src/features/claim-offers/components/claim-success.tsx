import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Body, Label, Meta, Title } from '@/components/ui/text';
import type { ClaimMembership, ClaimStubSummary } from '@/types/api';
import { PersonAvatar } from './claim-shared';

type ClaimSuccessProps = {
  stub: ClaimStubSummary;
  membership: ClaimMembership;
  groupName: string;
};

export function ClaimSuccess({ stub, membership, groupName }: ClaimSuccessProps) {
  const claimedName =
    `${membership.user.firstName} ${membership.user.lastName}`.trim() || stub.displayName;

  return (
    <div className="flex min-h-[70vh] flex-col items-center pt-10 text-center">
      <div className="flex size-[88px] items-center justify-center rounded-full bg-success/15 shadow-[inset_0_0_0_1.5px_var(--success)]">
        <Check className="size-11 text-success" strokeWidth={2.8} aria-hidden />
      </div>

      <Title className="mt-6 text-foreground">Perfil assumido</Title>
      <Body className="mx-auto mt-2 max-w-[19rem] text-muted-foreground">
        O histórico do perfil{' '}
        <span className="font-bold text-foreground">{stub.displayName}</span> agora é seu, sob{' '}
        <span className="font-bold text-foreground">{claimedName}</span> no {groupName}.
      </Body>

      <div className="mt-8 flex w-full items-center gap-3.5 rounded-[1.75rem] bg-surface p-4 shadow-hairline">
        <PersonAvatar seed={claimedName} name={claimedName} accent className="size-[54px] text-stat-md" />
        <div className="min-w-0 flex-1 text-left">
          <Label className="block truncate text-foreground">{claimedName}</Label>
          <Meta className="mt-0.5 block text-muted-foreground">
            {stub.rank ? `#${stub.rank} · ` : ''}
            {Math.round(stub.rating)} pts · {stub.matchesCount} partidas
          </Meta>
        </div>
      </div>

      <div className="mt-auto w-full pt-8">
        <Button asChild size="lg" className="w-full">
          <Link href={`/groups/${membership.groupId}`}>Ir para o grupo</Link>
        </Button>
      </div>
    </div>
  );
}
