'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GroupInvite } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { acceptInvite } from '@/features/invites/api/invites.api';
import { getAccessToken } from '@/lib/auth';

type Props = {
  invite: GroupInvite;
};

// Claim flow: the person takes over a stub player and turns it into their account.
// Case B (already a member of the group) is blocked with a clear message — merging
// duplicate profiles is future work.
export function ClaimAcceptClient({ invite }: Props) {
  const router = useRouter();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    setAuthToken(token);

    if (!token) {
      setIsChecking(false);
      return;
    }

    async function checkMembership(token: string) {
      try {
        const memberships = await getMyGroups(token);
        setAlreadyMember(
          memberships.some((item) => item.groupId === invite.groupId),
        );
      } catch {
        setAlreadyMember(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkMembership(token);
  }, [invite.groupId]);

  async function handleAccept() {
    if (!authToken) return;

    setError('');
    setIsAccepting(true);

    try {
      const result = await acceptInvite(authToken, invite.token);
      router.push(`/groups/${result.groupId}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível assumir o perfil. Tente novamente.',
      );
      setIsAccepting(false);
    }
  }

  const group = invite.group;
  const name = invite.targetDisplayName ?? 'este jogador';
  const claimHref = `/claim/${invite.token}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Assuma o perfil de</p>
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              em {group?.name ?? 'um grupo'}. Você fica com todo o histórico de
              partidas e o rating deste jogador.
            </p>
          </div>

          {!authToken ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Entre na sua conta ou crie uma para assumir este perfil.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild>
                  <Link href={`/login?redirect=${encodeURIComponent(claimHref)}`}>Entrar</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/register?redirect=${encodeURIComponent(claimHref)}`}>
                    Criar conta
                  </Link>
                </Button>
              </div>
            </div>
          ) : isChecking ? (
            <Button disabled className="w-full">
              Verificando…
            </Button>
          ) : alreadyMember ? (
            <p className="text-sm leading-6 text-muted-foreground">
              Você já está neste grupo. Fale com um administrador para unir os perfis.
            </p>
          ) : (
            <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
              {isAccepting ? 'Assumindo…' : 'Assumir este perfil'}
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
