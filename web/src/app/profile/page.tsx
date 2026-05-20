import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { AuthStatus } from '@/features/auth/components/auth-status';

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Perfil" description="Sua conta no BeachRank." />

        <AuthStatus />
      </div>
    </AppShell>
  );
}
