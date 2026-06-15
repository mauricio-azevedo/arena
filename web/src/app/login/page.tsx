import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { LoginForm } from '@/features/auth/components/login-form';
import { getSafeAuthRedirectPath } from '@/features/auth/helpers/auth-redirect.helper';

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectPath = getSafeAuthRedirectPath(getSingleSearchParam(params.redirect));

  return (
    <AppShell chrome={{ title: 'Entrar', back: { fallbackHref: '/', behavior: 'fallback' } }}>
      <div className="space-y-6">
        <PageIntro description="Acesse sua conta para ver seus grupos e registrar partidas." />
        <LoginForm redirectPath={redirectPath} />
      </div>
    </AppShell>
  );
}

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
