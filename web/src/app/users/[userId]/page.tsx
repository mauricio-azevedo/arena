import { AppShell } from '@/components/app-shell';
import { Profile } from '@/features/profile/profile';

type Props = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

export default async function UserProfilePage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = searchParams ? await searchParams : {};
  const fallbackHref = getSafeReturnHref(query.returnTo);

  return (
    <AppShell
      chrome={{
        title: 'Perfil',
        showBack: true,
        backHref: fallbackHref,
        preferBackHref: Boolean(query.returnTo),
      }}
    >
      <Profile userId={routeParams.userId} />
    </AppShell>
  );
}

function getSafeReturnHref(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/';
  }

  return returnTo;
}
