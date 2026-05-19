'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GroupMember, Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type GroupTab = 'ranking' | 'matches' | 'members';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
};

const tabs: { value: GroupTab; label: string }[] = [
  { value: 'ranking', label: 'Ranking' },
  { value: 'matches', label: 'Partidas' },
  { value: 'members', label: 'Membros' },
];

export function GroupDetailTabs({ groupId, activeTab, ranking, members, matches }: Props) {
  const router = useRouter();

  function setTab(tab: GroupTab) {
    router.replace(`/groups/${groupId}?tab=${tab}`, {
      scroll: false,
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 rounded-xl border bg-muted/30 p-1 text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTab(tab.value)}
            className={`rounded-lg px-3 py-2 ${
              activeTab === tab.value ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ranking' && <RankingTab ranking={ranking} />}
      {activeTab === 'matches' && <MatchesTab matches={matches} />}
      {activeTab === 'members' && <MembersTab members={members} />}
    </div>
  );
}

function RankingTab({ ranking }: { ranking: GroupMember[] }) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Nenhum jogador no ranking ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {ranking.map((member, index) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {index + 1}
              </span>

              <div>
                <p className="font-medium">{member.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
                </p>
              </div>
            </div>

            <p className="text-lg font-semibold">{member.rating.toFixed(1)}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function MatchesTab({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Nenhuma partida registrada</p>
          <p className="text-sm text-muted-foreground">
            Quando o grupo registrar partidas, elas aparecem aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {matches.map((match) => {
        const teamA = match.participants
          .filter((participant) => participant.team === 'TEAM_A')
          .sort((a, b) => a.position - b.position);

        const teamB = match.participants
          .filter((participant) => participant.team === 'TEAM_B')
          .sort((a, b) => a.position - b.position);

        const teamAWon = match.gamesA > match.gamesB;

        return (
          <Card key={match.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {new Date(match.playedAt).toLocaleDateString('pt-BR')}
                </p>

                <p className="text-lg font-semibold">
                  {match.gamesA}–{match.gamesB}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className={teamAWon ? 'font-medium' : 'text-muted-foreground'}>
                  {teamA.map((participant) => participant.displayNameSnapshot).join(' / ')}
                </div>

                <div className={!teamAWon ? 'font-medium' : 'text-muted-foreground'}>
                  {teamB.map((participant) => participant.displayNameSnapshot).join(' / ')}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function MembersTab({ members }: { members: GroupMember[] }) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Nenhum membro no grupo ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{member.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
              </p>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href={`/players/${member.id}`}>Ver</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
