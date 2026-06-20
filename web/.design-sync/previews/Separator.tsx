import { Separator } from '@/components/ui/separator';

export function Horizontal() {
  return (
    <div className="w-72">
      <div className="text-body-strong">Ranking do grupo</div>
      <Separator className="my-3" />
      <div className="text-muted-foreground">12 membros</div>
    </div>
  );
}

export function Vertical() {
  return (
    <div className="flex h-8 items-center gap-3 text-muted-foreground">
      <span>12 partidas</span>
      <Separator orientation="vertical" />
      <span>8 vitórias</span>
      <Separator orientation="vertical" />
      <span>67%</span>
    </div>
  );
}
