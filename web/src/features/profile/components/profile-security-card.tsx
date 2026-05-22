'use client';

import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  onCancel: () => void;
};

export function ProfileSecurityCard({ onCancel }: Props) {
  return (
    <Card className="border-primary/15 bg-card/95 shadow-[0_18px_55px_rgba(84,54,20,0.12)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold tracking-[-0.02em]">Segurança da conta</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ajustes sensíveis ficam em um painel separado dos dados do perfil.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">Placeholder do formulário de segurança</p>
          <p className="mt-1">
            A estrutura visual e a navegação já estão separadas. O formulário final deve chamar o
            client de API em <code>profile-password.api.ts</code> e tratar sucesso, erro e limpeza dos
            campos neste card.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={onCancel} className="w-full">
          Voltar
        </Button>
      </CardContent>
    </Card>
  );
}
