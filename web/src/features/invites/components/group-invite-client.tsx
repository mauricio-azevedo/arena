'use client';

import { useState } from 'react';
import type { GroupInvite } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createGroupInvite } from '@/features/invites/api/invites.api';
import { getAccessToken } from '@/lib/auth';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

type Props = {
  groupId: string;
};

export function GroupInviteClient({ groupId }: Props) {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  async function handleCreateInvite() {
    const token = getAccessToken();

    if (!token) {
      setError('Entre na sua conta para gerar convite.');
      return;
    }

    setError('');
    setIsCreating(true);

    try {
      const result = await createGroupInvite(token, groupId);
      setInvite(result);
    } catch {
      setError('Não foi possível gerar o convite. Apenas admins podem convidar pessoas.');
    } finally {
      setIsCreating(false);
    }
  }

  const inviteUrl = invite ? `${window.location.origin}${invite.path}` : '';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Link de convite</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Qualquer pessoa com esse link poderá criar conta, entrar e participar do grupo.
            </p>
          </div>

          <Button onClick={handleCreateInvite} loading={isCreating} className="w-full">
            Gerar link de convite
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {invite && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm break-all">{inviteUrl}</div>

            <Button onClick={() => copy(inviteUrl)} variant="outline" className="w-full">
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>

            <div className="text-xs text-muted-foreground">Usado {invite.uses} vez(es)</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
