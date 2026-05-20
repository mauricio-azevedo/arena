import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function SignedOutFeedState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Entre para ver seu feed</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Acompanhe os momentos dos grupos onde você joga.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild>
            <Link href="/login?redirect=/">Entrar</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/register?redirect=/">Criar conta</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
