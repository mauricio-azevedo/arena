import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyMuted, TypographySmall } from '@/components/ui/typography';

export function ProfileSignedOutState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <TypographySmall>Entre para ver seu perfil</TypographySmall>
          <TypographyMuted>Veja seu histórico, seus grupos e suas estatísticas.</TypographyMuted>
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
