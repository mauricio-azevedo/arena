import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { Profile } from '@/features/profile/profile';

type Props = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    returnLabel?: string;
  }>;
};

export default async function UserProfilePage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = searchParams ? await searchParams : {};
  const fallbackHref = getSafeReturnHref(query.returnTo);
  const fallbackLabel = getSafeReturnLabel(query.returnLabel, fallbackHref);

  return (
    <AppShell>
      <div className="space-y-6">
        <BackButton
          href={fallbackHref}
          label={fallbackLabel}
          preferHref={Boolean(query.returnTo)}
        />
        <Profile userId={routeParams.userId} />
      </div>
    </AppShell>
  );
}

function getSafeReturnHref(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/groups';
  }

  return returnTo;
}

function getSafeReturnLabel(returnLabel: string | undefined, href: string) {
  if (returnLabel === 'Grupo' || returnLabel === 'Grupos' || returnLabel === 'Perfil') {
    return returnLabel;
  }

  if (href.startsWith('/groups/')) {
    return 'Grupo';
  }

  if (href === '/profile') {
    return 'Perfil';
  }

  return 'Grupos';
}
