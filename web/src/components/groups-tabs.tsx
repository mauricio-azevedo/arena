'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Group, MyGroup } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getMyGroups } from '@/features/groups/groups.api';

type Props = {
  groups: Group[];
};

const TOKEN_STORAGE_KEY = 'beachrank_access_token';

export function GroupsTabs({ groups }: Props) {
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
  const [token, setToken] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [isLoadingMyGroups, setIsLoadingMyGroups] = useState(true);
  const [myGroupsError, setMyGroupsError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    setToken(storedToken);

    if (!storedToken) {
      setIsLoadingMyGroups(false);
      return;
    }

    async function loadMyGroups(token: string) {
      try {
        setIsLoadingMyGroups(true);
        setMyGroupsError(null);

        const data = await getMyGroups(token);
        setMyGroups(data);
      } catch {
        setMyGroupsError('Não foi possível carregar seus grupos.');
      } finally {
        setIsLoadingMyGroups(false);
      }
    }

    loadMyGroups(storedToken);
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl border bg-muted/30 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('mine')}
          className={`rounded-lg px-3 py-2 ${
            activeTab === 'mine' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Meus grupos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`rounded-lg px-3 py-2 ${
            activeTab === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Todos os grupos
        </button>
      </div>

      {activeTab === 'mine' ? (
        <MyGroups
          token={token}
          myGroups={myGroups}
          isLoading={isLoadingMyGroups}
          error={myGroupsError}
        />
      ) : (
        <AllGroups groups={groups} />
      )}
    </div>
  );
}

function MyGroups({
  token,
  myGroups,
  isLoading,
  error,
}: {
  token: string | null;
  myGroups: MyGroup[];
  isLoading: boolean;
  error: string | null;
}) {
  if (!token) {
    return <MyGroupsSignedOut />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Carregando seus grupos...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Algo deu errado</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (myGroups.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Você ainda não participa de nenhum grupo</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Entre por um convite ou crie um grupo para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Meus grupos</h2>

      {myGroups.map((membership) => (
        <MyGroupCard key={membership.id} membership={membership} />
      ))}
    </section>
  );
}

function MyGroupCard({ membership }: { membership: MyGroup }) {
  const group = membership.group;

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium">{group.name}</h3>

            {group.description && (
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>

          <span className="rounded-full border px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {membership.role === 'ADMIN' ? 'Admin' : 'Membro'}
          </span>
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{group._count?.members ?? 0} membros</span>
          <span>{group._count?.matches ?? 0} partidas</span>
          <span>Rating {membership.rating.toFixed(1)}</span>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/groups/${group.id}`}>Abrir grupo</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MyGroupsSignedOut() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">Entre para ver seus grupos</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Quando você entrar na sua conta, seus grupos aparecem aqui.
        </p>

        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/login">Entrar</Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link href="/register">Criar conta</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AllGroups({ groups }: { groups: Group[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Todos os grupos</h2>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhum grupo público ainda.
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => <GroupCard key={group.id} group={group} />)
      )}
    </section>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div>
          <h3 className="font-medium">{group.name}</h3>

          {group.description && (
            <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{group._count?.members ?? 0} membros</span>
          <span>{group._count?.matches ?? 0} partidas</span>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/groups/${group.id}`}>Ver grupo</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
