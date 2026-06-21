'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GroupMember, Match } from '@/types/api';
import { Label } from '@/components/ui/text';
import { MatchesList } from '@/features/matches/components/matches-list';
import { RankingList } from '@/features/groups/components/ranking-list';
import { cn } from '@/lib/utils';

export type GroupTab = 'ranking' | 'matches';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  matches: Match[];
  canManageMatches: boolean;
  currentMembershipId: string | null;
};

export function GroupDetailTabs({
  groupId,
  activeTab,
  ranking,
  matches,
  canManageMatches,
  currentMembershipId,
}: Props) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<GroupTab>(activeTab);
  const tabs = useMemo(
    () => [
      { value: 'ranking' as const, label: 'Ranking' },
      { value: 'matches' as const, label: 'Partidas' },
    ],
    [],
  );

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  function setTab(tab: GroupTab) {
    setSelectedTab(tab);
    const nextUrl = tab === 'ranking' ? `/groups/${groupId}` : `/groups/${groupId}?tab=${tab}`;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-7 border-b border-divider">
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTab(tab.value)}
              aria-pressed={isSelected}
              className={cn(
                '-mb-px flex h-12 items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors',
                isSelected
                  ? 'border-brand text-foreground'
                  : 'border-transparent text-faint-foreground hover:text-foreground',
              )}
            >
              <Label>{tab.label}</Label>
            </button>
          );
        })}
      </div>

      {selectedTab === 'ranking' && (
        <TabPanel>
          <RankingList ranking={ranking} currentMembershipId={currentMembershipId} />
        </TabPanel>
      )}

      {selectedTab === 'matches' && (
        <TabPanel>
          <MatchesTab matches={matches} groupId={groupId} canManage={canManageMatches} />
        </TabPanel>
      )}
    </div>
  );
}

function TabPanel({ children }: { children: ReactNode }) {
  return <div className="outline-none">{children}</div>;
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
      emptyDescription="Registre a primeira partida para começar a movimentar o ranking."
    />
  );
}
