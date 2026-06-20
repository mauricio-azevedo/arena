import { Stat, Eyebrow } from '@/components/ui/text';

export function Rating() {
  return (
    <div className="flex flex-col">
      <Eyebrow className="text-muted-foreground">Rating</Eyebrow>
      <Stat size="lg">1248</Stat>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-baseline gap-6">
      <Stat>1248</Stat>
      <Stat size="lg">1310</Stat>
    </div>
  );
}
