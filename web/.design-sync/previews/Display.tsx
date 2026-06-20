import { Display, Eyebrow } from '@/components/ui/text';

export function HeroRank() {
  return (
    <div className="flex flex-col items-center gap-1">
      <Eyebrow className="text-muted-foreground">Sua posição</Eyebrow>
      <Display>#3</Display>
    </div>
  );
}

export function Score() {
  return (
    <div className="flex items-center gap-4">
      <Display>6</Display>
      <Display className="text-muted-foreground">4</Display>
    </div>
  );
}
