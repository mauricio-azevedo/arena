'use client';

import { useState } from 'react';
import { createGroupInvite } from '@/lib/api';
import type { GroupInvite } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TOKEN_STORAGE_KEY = 'beachrank_access_token';

type Props = {
  groupId: string;
};

export function GroupInviteClient({ groupId }: Props) {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateInvite() {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setError('Entre na sua conta para gerar convite.');
      return;
    }

    setError('');
    setCopied(false);
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

  async function handleCopy() {
    if (!invite) return;

    const inviteUrl = `${window.location.origin}${invite.path}`;

    await window.navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
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

          <Button onClick={handleCreateInvite} disabled={isCreating} className="w-full">
            {isCreating ? 'Gerando...' : 'Gerar link de convite'}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {invite && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm break-all">{inviteUrl}</div>

            <Button onClick={handleCopy} variant="outline" className="w-full">
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>

            <div className="text-xs text-muted-foreground">Usado {invite.uses} vez(es)</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
