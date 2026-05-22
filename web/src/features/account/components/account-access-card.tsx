import { Card, CardContent } from '@/components/ui/card';

export function AccountAccessCard() {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Segurança</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Área para atualizar o acesso da conta.
        </p>
      </CardContent>
    </Card>
  );
}
