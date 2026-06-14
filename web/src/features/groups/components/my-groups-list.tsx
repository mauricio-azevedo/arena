'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Plus, UsersRound } from 'lucide-react';
import type { MyGroup } from '@/types/api';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyH4, TypographyLarge, TypographyMuted, TypographySmall } from '@/components/ui/typography';
import { getGroupInitials } from '@/features/groups/helpers/group-initials.helper';

type Props = {
  loadGroups?: () => Promise<MyGroup[]>;
  ratingLabel?: string;
};

export function MyGroupsList({ loadGroups, ratingLabel = 'Você' }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedToken = getAccessToken();
    setToken(storedToken);

    if (!storedToken && !loadGroups) {
      setIsLoading(false);
      return;
    }

    async function load() {
      try {
        setError('');
        const data = loadGroups ? await loadGroups() : await getMyGroups(storedToken as string);
        setMyGroups(data);
      } catch {
        setError('Não foi possível carregar os grupos.');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadGroups]);

  if (!token && !loadGroups) {
    return <SignedOutGroupsState />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <TypographyMuted>Carregando grupos...</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <TypographySmall>Algo deu errado</TypographySmall>
          <TypographyMuted>{error}</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  if (myGroups.length === 0) {
    return loadGroups ? <EmptyPublicGroupsState /> : <EmptyGroupsState />;
  }

  return (
    <section className="space-y-3">
      {myGroups.map((membership) => (
        <MyGroupCard key={membership.id} membership={membership} ratingLabel={ratingLabel} />
      ))}
    </section>
  );
}

function MyGroupCard({ membership, ratingLabel }: { membership: MyGroup; ratingLabel: string }) {
  const group = membership.group;

  return (
    <Link href={`/groups/${group.id}`} className="block">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <TypographySmall>{getGroupInitials(group.name)}</TypographySmall>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <TypographyH4>{group.name}</TypographyH4>

                {membership.role === 'ADMIN' && <TypographySmall>Admin</TypographySmall>}
              </div>

              {group.description && <TypographyMuted>{group.description}</TypographyMuted>}
            </div>

            <ChevronRight className="mt-1 h-4 w-4 shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <GroupMetric label="Membros" value={group._count?.members ?? 0} />
            <GroupMetric label="Partidas" value={group._count?.matches ?? 0} />
            <GroupMetric label={ratingLabel} value={membership.rating.toFixed(0)} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function GroupMetric({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="px-3 py-2">
      <TypographyLarge>{value}</TypographyLarge>
      <TypographyMuted>{label}</TypographyMuted>
    </div>
  );
}

function SignedOutGroupsState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex h-11 w-11 items-center justify-center">
            <UsersRound className="h-5 w-5" />
          </div>
          <TypographySmall>Entre para ver seus grupos</TypographySmall>
          <TypographyMuted>Seus grupos aparecem aqui quando você entra na sua conta.</TypographyMuted>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild>
            <Link href="/login?redirect=/">Entrar</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/register?redirect=/">Criar conta</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyGroupsState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex h-11 w-11 items-center justify-center">
            <UsersRound className="h-5 w-5" />
          </div>
          <TypographySmall>Você ainda não tem grupos</TypographySmall>
          <TypographyMuted>Crie um grupo ou entre por um convite para começar.</TypographyMuted>
        </div>

        <Button asChild className="w-full">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            Criar grupo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyPublicGroupsState() {
  return (
    <Card>
      <CardContent className="p-4">
        <TypographyMuted>Este jogador ainda não participa de grupos.</TypographyMuted>
      </CardContent>
    </Card>
  );
}
