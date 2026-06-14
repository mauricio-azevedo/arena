import { AppShell } from '@/components/app-shell';
import { CreateGroupForm } from '@/features/groups/components/create-group-form';

export default function NewGroupPage() {
  return (
    <AppShell>
      <CreateGroupForm />
    </AppShell>
  );
}
