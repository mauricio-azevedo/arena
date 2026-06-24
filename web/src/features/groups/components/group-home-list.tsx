'use client';
import { useEffect, useState } from 'react';
import { Users, UsersRound } from 'lucide-react';
import { SignedOutCtaCard } from '@/features/auth/components/signed-out-cta-card';
import { getGroupHome } from '@/features/groups/api/groups.api';
import {
  CompactGroupCard,
  DiscoveryGroupCard,
  FeaturedGroupCard,
  HomeTopline,
  PublicSuggestionIntro,
} from '@/features/groups/components/group-home-cards';
import {
  GroupHomeEmptyState,
  GroupHomeErrorState,
  GroupHomeLoadingState,
} from '@/features/groups/components/group-home-states';
import type { GroupHomeCard } from '@/features/groups/types/group-home.type';
import { getAccessToken } from '@/lib/auth';

type LoadState = 'loading' | 'ready' | 'error';

export function GroupHomeList() {
  const [token] = useState(() => getAccessToken());
  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<GroupHomeCard[]>([]);
  const hasToken = Boolean(token);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState('loading');
      try {
        const data = await getGroupHome(token ?? undefined);
        if (!isCurrent) {
          return;
        }
        setItems(data);
        setState('ready');
      } catch {
        if (!isCurrent) {
          return;
        }
        setState('error');
      }
    }
    load();
    return () => {
      isCurrent = false;
    };
  }, [token]);

  if (state === 'loading') {
    return <GroupHomeLoadingState />;
  }
  if (state === 'error') {
    return <GroupHomeErrorState />;
  }
  if (items.length === 0) {
    return <GroupHomeEmptyState hasToken={hasToken} />;
  }
  const memberItems = items.filter((item) => item.relationship === 'MEMBER');
  const suggestionItems = items.filter((item) => item.relationship === 'PUBLIC_SUGGESTION');
  if (memberItems.length === 0) {
    return (
      <section className="space-y-comfortable">
        {hasToken && <PublicSuggestionIntro />}
        <div className="space-y-base">
          {suggestionItems.map((item) => (
            <DiscoveryGroupCard key={item.group.id} item={item} />
          ))}
        </div>
        {!hasToken && (
          <SignedOutCtaCard
            icon={UsersRound}
            title="Crie sua conta para competir"
            description="Salve grupos, acompanhe rankings e registre partidas."
            redirectPath="/"
            primaryAction="register"
          />
        )}
      </section>
    );
  }
  const featuredItem = memberItems[0]!;
  const compactItems = memberItems.slice(1);
  return (
    <section className="space-y-base">
      <div className="flex items-center gap-base px-1">
        <Users className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-base font-semibold tracking-[-0.035em] text-foreground">Meus Grupos</h2>
      </div>
      {memberItems.length > 1 && <HomeTopline items={memberItems} />}
      <FeaturedGroupCard item={featuredItem} />
      {compactItems.length > 0 && (
        <div className="space-y-base">
          {compactItems.map((item) => (
            <CompactGroupCard key={item.group.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
