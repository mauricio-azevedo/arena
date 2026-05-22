'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const label = 'Senha';
const hiddenType = 'password';

export function AccountAccessCard() {
  const [currentValue, setCurrentValue] = useState('');
  const [nextValue, setNextValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Segurança</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Use uma {label.toLowerCase()} nova e diferente da atual.
          </p>
        </div>

        <form className="space-y-3">
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

          <Button type="button" variant="outline" className="h-11 w-full">
            Atualizar {label.toLowerCase()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
