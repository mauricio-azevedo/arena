import { Card, CardContent } from '@/components/ui/card';

export function ProfileLoadingState() {
  return (
    <Card>
      <CardContent className="p-4 text-sm text-muted-foreground">Carregando perfil...</CardContent>
    </Card>
  );
}
