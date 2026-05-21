import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { Profile } from '@/features/profile/profile';

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({ params }: Props) {
  const routeParams = await params;

  return (
    <AppShell>
      <div className="space-y-6">
        <BackButton href="/groups" />
        <Profile userId={routeParams.userId} />
      </div>
    </AppShell>
  );
}
