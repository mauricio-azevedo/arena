import { AppShell } from '@/components/app-shell';
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

  return (
    <AppShell>
      <GroupDetail groupId={groupId} tab={tab} />
    </AppShell>
  );
}
