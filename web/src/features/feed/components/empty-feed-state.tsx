import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyMuted, TypographySmall } from '@/components/ui/typography';

export function EmptyFeedState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <TypographySmall>Nada por aqui ainda</TypographySmall>
          <TypographyMuted>As novidades dos seus grupos aparecem aqui.</TypographyMuted>
        </div>

        <Button asChild className="w-full">
          <Link href="/groups">Ver meus grupos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
