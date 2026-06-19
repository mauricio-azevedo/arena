import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getGroup } from '@/features/groups/api/groups.api';
import { GroupDetail } from '@/features/groups/group-detail';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function GroupDetailPage({ params, searchParams }: Props) {
  const { groupId } = await params;
  const { tab } = await searchParams;
  await getGroup(groupId).catch(() => notFound());

  return (
    <AppShell chrome={{ back: { fallbackHref: '/' } }}>
      <GroupDetail groupId={groupId} tab={tab} />
    </AppShell>
  );
}
