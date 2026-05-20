import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyFeedState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Nada por aqui ainda</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Quando algo interessante acontecer nos seus grupos, aparece aqui.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/groups">Ver meus grupos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
