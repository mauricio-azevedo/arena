import { Card, CardContent } from '@/components/ui/card';

export function FeedLoadingState() {
  return (
    <Card>
      <CardContent className="p-4 text-sm text-muted-foreground">Carregando feed...</CardContent>
    </Card>
  );
}
