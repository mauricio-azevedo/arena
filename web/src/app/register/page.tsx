import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { RegisterForm } from '@/features/auth/components/register-form';
import { getSafeAuthRedirectPath } from '@/features/auth/helpers/auth-redirect.helper';
import { getFirstSearchParam } from '@/lib/search-params';

type RegisterPageProps = {
  searchParams: Promise<{
    redirect?: string | string[];
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const redirectPath = getSafeAuthRedirectPath(getFirstSearchParam(params.redirect));

  return (
    <AppShell chrome={{ title: 'Criar conta', back: { fallbackHref: '/', behavior: 'fallback' } }}>
      <div className="space-y-6">
        <PageIntro description="Crie sua conta para participar de grupos e acompanhar seu ranking." />
        <RegisterForm redirectPath={redirectPath} />
      </div>
    </AppShell>
  );
}
