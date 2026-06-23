import { AppShell } from '@/components/app-shell';
import { ProfileScreen } from '@/features/profile/profile-screen';

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({ params }: Props) {
  const routeParams = await params;

  return (
    <AppShell chrome={{ back: { fallbackHref: '/' } }}>
      <ProfileScreen userId={routeParams.userId} />
    </AppShell>
  );
}
