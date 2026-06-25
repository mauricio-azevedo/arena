'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyMuted, TypographySmall } from '@/components/ui/typography';
import { useAuthDrawer } from '@/features/auth/auth-drawer-provider';

export function SignedOutFeedState() {
  const { open } = useAuthDrawer();

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <TypographySmall>Entre para ver seu feed</TypographySmall>
          <TypographyMuted>Acompanhe os momentos dos grupos onde você joga.</TypographyMuted>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => open({ view: 'login', intent: { redirectPath: '/' } })}>
            Entrar
          </Button>

          <Button
            variant="outline"
            onClick={() => open({ view: 'signup', intent: { redirectPath: '/' } })}
          >
            Criar conta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
