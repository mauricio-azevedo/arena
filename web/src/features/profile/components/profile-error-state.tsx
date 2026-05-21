import { Card, CardContent } from '@/components/ui/card';

type Props = {
  error: string;
};

export function ProfileErrorState({ error }: Props) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-medium">Algo deu errado</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </CardContent>
    </Card>
  );
}
