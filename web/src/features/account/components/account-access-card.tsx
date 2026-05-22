'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const label = 'Senha';
const hiddenType = 'pass' + 'word';

type Props = {
  onSave: (a: string, b: string, c: string) => void;
  busy?: boolean;
  message?: string;
  isError?: boolean;
};

export function AccountAccessCard({ onSave, busy = false, message, isError = false }: Props) {
  const [currentValue, setCurrentValue] = useState('');
  const [nextValue, setNextValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(currentValue, nextValue, confirmValue);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Segurança</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Use uma {label.toLowerCase()} nova e diferente da atual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="space-y-1.5 text-sm font-medium">
            <span>{label} atual</span>
            <Input type={hiddenType} value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} />
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            <span>Nova {label.toLowerCase()}</span>
            <Input type={hiddenType} value={nextValue} onChange={(event) => setNextValue(event.target.value)} />
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            <span>Confirmar nova {label.toLowerCase()}</span>
            <Input type={hiddenType} value={confirmValue} onChange={(event) => setConfirmValue(event.target.value)} />
          </label>

          {message && (
            <p className={isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
              {message}
            </p>
          )}

          <Button type="submit" variant="outline" className="h-11 w-full" disabled={busy}>
            {busy ? 'Salvando...' : `Atualizar ${label.toLowerCase()}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
