import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ProfileSignedOutState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Entre para ver seu perfil</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Acompanhe seu histórico, seus grupos e suas estatísticas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild>
            <Link href="/login?redirect=/profile">Entrar</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/register?redirect=/profile">Criar conta</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
