import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eyebrow, Stat, Title } from '@/components/ui/text';

export function StandingCard() {
  return (
    <Card className="w-80">
      <CardHeader>
        <Eyebrow>Sua posição</Eyebrow>
        <CardTitle className="flex items-baseline gap-2">
          <Title>Caio Ribeiro</Title>
          <Badge variant="brand">#3</Badge>
        </CardTitle>
        <CardDescription>Subiu 1 posição desde ontem</CardDescription>
        <CardAction>
          <Stat>1248</Stat>
        </CardAction>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        12 partidas · 8 vitórias · 67% de aproveitamento
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="secondary">
          Ver histórico
        </Button>
      </CardFooter>
    </Card>
  );
}

export function MatchCard() {
  return (
    <Card size="sm" className="w-80">
      <CardContent className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-body-strong">Caio / Bruno</span>
          <span className="text-body-strong text-muted-foreground">Diego / Léo</span>
        </div>
        <div className="flex items-center gap-1">
          <Stat>6</Stat>
          <span className="text-muted-foreground">·</span>
          <Stat className="text-muted-foreground">4</Stat>
        </div>
      </CardContent>
    </Card>
  );
}
