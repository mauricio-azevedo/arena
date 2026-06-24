import { Card, CardContent } from '@/components/ui/card';
import { TypographyMuted, TypographySmall } from '@/components/ui/typography';

type Props = {
  error: string;
};

export function ProfileErrorState({ error }: Props) {
  return (
    <Card>
      <CardContent className="space-y-snug p-4">
        <TypographySmall>Algo deu errado</TypographySmall>
        <TypographyMuted>{error}</TypographyMuted>
      </CardContent>
    </Card>
  );
}
