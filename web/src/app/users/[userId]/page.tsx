import { AppShell } from '@/components/app-shell';
import { Profile } from '@/features/profile/profile';

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;

  return (
    <AppShell>
      <Profile userId={userId} />
    </AppShell>
  );
}
