import { LogoutButton } from '@/features/auth/components/logout-button';
import { Card, CardContent } from '@/components/ui/card';

export function ProfileAccountSection() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">Conta</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Saia deste dispositivo quando terminar de usar o Arena.
          </p>
        </div>

        <LogoutButton className="shrink-0" />
      </CardContent>
    </Card>
  );
}
