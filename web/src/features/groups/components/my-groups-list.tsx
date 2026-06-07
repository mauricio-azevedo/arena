'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Plus, UsersRound } from 'lucide-react';
import type { MyGroup } from '@/types/api';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        <CardContent className="p-4 text-sm text-muted-foreground">Carregando grupos...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Algo deu errado</p>
          <p className="text-sm leading-6 text-muted-foreground">{error}</p>
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
      <Card className="br-pressable">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-primary/18 via-white/22 to-accent/55 text-sm font-bold text-primary ring-1 ring-primary/10 dark:via-white/8">
              {getGroupInitials(group.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-[-0.035em]">{group.name}</h2>

                {membership.role === 'ADMIN' && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    Admin
                  </span>
                )}
              </div>

              {group.description && (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {group.description}
                </p>
              )}
            </div>

            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <GroupMetric label="Membros" value={group._count?.members ?? 0} />
            <GroupMetric label="Partidas" value={group._count?.matches ?? 0} />
            <GroupMetric label={ratingLabel} value={membership.rating.toFixed(0)} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function GroupMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] bg-white/42 px-3 py-2 shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] backdrop-blur-xl dark:bg-white/8">
      <p className="font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SignedOutGroupsState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-accent text-accent-foreground">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">Entre para ver seus grupos</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Seus grupos aparecem aqui quando você entra na sua conta.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild>
            <Link href="/login?redirect=/groups">Entrar</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/register?redirect=/groups">Criar conta</Link>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-accent text-accent-foreground">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">Você ainda não tem grupos</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Crie um grupo ou entre por um convite para começar.
          </p>
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
      <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
        Este jogador ainda não participa de grupos.
      </CardContent>
    </Card>
  );
}
