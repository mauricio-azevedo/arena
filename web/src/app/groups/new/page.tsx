import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { PageHeader } from '@/components/page-header';
import { CreateGroupForm } from '@/features/groups/components/create-group-form';

export default function NewGroupPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <BackButton href="/groups" />
        <PageHeader
          title="Criar grupo"
          description="Monte um grupo para registrar partidas e acompanhar o ranking da galera."
        />
        <CreateGroupForm />
      </div>
    </AppShell>
  );
}
