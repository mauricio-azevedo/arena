import { AppShell } from '@/components/app-shell';
import { PageIntro } from '@/components/page-intro';
import { CreateGroupForm } from '@/features/groups/components/create-group-form';

export default function NewGroupPage() {
  return (
    <AppShell chrome={{ title: 'Criar grupo', back: { fallbackHref: '/' } }}>
      <div className="space-y-6">
        <PageIntro description="Monte um grupo para registrar partidas e acompanhar o ranking da galera." />
        <CreateGroupForm />
      </div>
    </AppShell>
  );
}
