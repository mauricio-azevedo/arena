'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { GroupMember, Match, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchesList } from '@/features/matches/components/matches-list';
import { UserNameLink } from '@/features/users/components/user-name-link';
import { getAccessToken } from '@/lib/auth';
import { getGroupFeed } from '@/features/feed/feed.api';
import { FeedItemCard } from '@/features/feed/components/feed-item-card';
import type { FeedItem } from '@/features/feed/types/feed-item.type';

type GroupTab = 'ranking' | 'matches' | 'activity' | 'members';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  canManageMatches: boolean;
};

const tabs: { value: GroupTab; label: string }[] = [
  { value: 'ranking', label: 'Ranking' },
  { value: 'matches', label: 'Partidas' },
  { value: 'activity', label: 'Atividade' },
  { value: 'members', label: 'Membros' },
];

export function GroupDetailTabs({
  groupId,
  activeTab,
  ranking,
  members,
  matches,
  canManageMatches,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<GroupTab>(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  function setTab(tab: GroupTab) {
    setSelectedTab(tab);

    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = tab === 'ranking' ? `/groups/${groupId}` : `/groups/${groupId}?tab=${tab}`;
    window.history.replaceState(null, '', nextUrl);
  }

  return (
    <Tabs value={selectedTab} onValueChange={(value) => setTab(value as GroupTab)}>
      <TabsList className="w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="ranking">
        <RankingTab ranking={ranking} />
      </TabsContent>

      <TabsContent value="matches">
        <MatchesTab matches={matches} groupId={groupId} canManage={canManageMatches} />
      </TabsContent>

      <TabsContent value="activity">
        <ActivityTab groupId={groupId} />
      </TabsContent>

      <TabsContent value="members">
        <MembersTab members={members} />
      </TabsContent>
    </Tabs>
  );
}

function RankingTab({ ranking }: { ranking: GroupMember[] }) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          Nenhum jogador no ranking ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {ranking.map((member, index) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate font-medium text-foreground">
                    <UserNameLink userId={member.userId}>
                      {getMemberDisplayName(member)}
                    </UserNameLink>
                  </p>
                  <RankingMovementBadge movement={member.rankingMovement} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xl font-semibold tracking-[-0.03em]">{member.rating.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">rating</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function RankingMovementBadge({ movement }: { movement?: RankingMovement | null }) {
  if (!movement) {
    return null;
  }

  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const verb = isUp ? 'Subiu' : 'Caiu';
  const label = `${verb} ${movement.positions} ${movement.positions === 1 ? 'posição' : 'posições'} no ranking`;

  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium leading-none"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {movement.positions}
    </span>
  );
}

function MatchesTab({
  matches,
  groupId,
  canManage,
}: {
  matches: Match[];
  groupId: string;
  canManage: boolean;
}) {
  return (
    <MatchesList
      matches={matches}
      groupId={groupId}
      canManage={canManage}
      emptyTitle="Nenhuma partida registrada"
      emptyDescription="Quando o grupo registrar partidas, elas aparecem aqui."
    />
  );
}

function ActivityTab({ groupId }: { groupId: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'signed-out' | 'error'>(
    'idle',
  );

  useEffect(() => {
    let isCurrent = true;
    const token = getAccessToken();

    if (!token) {
      setStatus('signed-out');
      return;
    }

    async function loadActivity(authToken: string) {
      setStatus('loading');

      try {
        const data = await getGroupFeed(groupId, authToken);

        if (!isCurrent) {
          return;
        }

        setItems(data);
        setStatus('ready');
      } catch {
        if (!isCurrent) {
          return;
        }

        setStatus('error');
      }
    }

    loadActivity(token);

    return () => {
      isCurrent = false;
    };
  }, [groupId]);

  if (status === 'loading' || status === 'idle') {
    return (
      <ActivityStateCard
        title="Carregando atividade"
        description="Buscando os acontecimentos mais recentes do grupo."
      />
    );
  }

  if (status === 'signed-out') {
    return (
      <ActivityStateCard
        title="Entre para ver a atividade"
        description="A atividade do grupo fica disponível para membros autenticados."
      />
    );
  }

  if (status === 'error') {
    return (
      <ActivityStateCard
        title="Não foi possível carregar a atividade"
        description="Verifique sua conexão e tente novamente."
      />
    );
  }

  if (items.length === 0) {
    return (
      <ActivityStateCard
        title="Nada aconteceu ainda"
        description="Quando partidas e mudanças de ranking forem registradas, elas aparecem aqui."
      />
    );
  }

  return (
    <section className="space-y-3">
      {items.map((item) => (
        <FeedItemCard key={item.id} item={item} context="group" />
      ))}
    </section>
  );
}

function ActivityStateCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MembersTab({ members }: { members: GroupMember[] }) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          Nenhum membro no grupo ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                <UserNameLink userId={member.userId}>{getMemberDisplayName(member)}</UserNameLink>
              </p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
              </p>
            </div>

            <span className="px-3 py-1 text-xs font-medium text-muted-foreground">
              {member.rating.toFixed(0)}
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function getMemberDisplayName(member: GroupMember) {
  if (!member.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim();
}
