'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPlayer } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AddPlayerForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage('Digite o nome do jogador.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await createPlayer(trimmedName);
      setName('');
      setMessage('Jogador adicionado.');
      router.refresh();
    } catch {
      setMessage('Não foi possível adicionar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do jogador"
              className="h-12"
            />

            <Button type="submit" className="h-12 shrink-0" disabled={isSubmitting}>
              {isSubmitting ? '...' : 'Adicionar'}
            </Button>
          </div>

          {message && <p className="px-1 text-sm text-muted-foreground">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
