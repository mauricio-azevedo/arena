'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import type { MyGroup } from '@/types/api';
import { getMyGroups } from '@/features/groups/groups.api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
        <CardContent className="p-4 text-sm text-muted-foreground">
          Carregando grupos...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium">Algo deu errado</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
      <Card className="transition active:scale-[0.99]">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-medium">{group.name}</h2>

                {membership.role === 'ADMIN' && (
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Admin
                  </span>
                )}
              </div>

              {group.description && (
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {group.description}
                </p>
              )}
            </div>

            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{group._count?.members ?? 0} membros</span>
            <span>{group._count?.matches ?? 0} partidas</span>
            <span>
              {ratingLabel} · {membership.rating.toFixed(1)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SignedOutGroupsState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Entre para ver seus grupos</p>
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
        <div className="space-y-1">
          <p className="text-sm font-medium">Você ainda não tem grupos</p>
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
      <CardContent className="p-4 text-sm text-muted-foreground">
        Este jogador ainda não participa de grupos.
      </CardContent>
    </Card>
  );
}
