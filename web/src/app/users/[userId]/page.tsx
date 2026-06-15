import { AppShell } from '@/components/app-shell';
import { Profile } from '@/features/profile/profile';

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({ params }: Props) {
  const routeParams = await params;

  return (
    <AppShell chrome={{ title: 'Perfil', back: { fallbackHref: '/' } }}>
      <Profile userId={routeParams.userId} />
    </AppShell>
  );
}
