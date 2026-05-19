'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGroup } from '@/features/groups/groups.api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function CreateGroupForm() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = getAccessToken();

    if (!storedToken) {
      router.replace('/login?redirect=/groups/new');
      return;
    }

    setToken(storedToken);
    setIsCheckingToken(false);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Entre na sua conta para criar um grupo.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError('Informe o nome do grupo.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const group = await createGroup(token, {
        name: trimmedName,
        description: trimmedDescription || undefined,
      });

      router.push(`/groups/${group.id}`);
      router.refresh();
    } catch {
      setError('Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingToken) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Verificando sua conta...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do grupo</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Beach terça 19h"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Grupo da galera que joga toda terça."
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar grupo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
