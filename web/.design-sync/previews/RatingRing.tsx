import { RatingRing } from '@/components/ui/rating-ring';
import { Stat, Eyebrow } from '@/components/ui/text';

export function Progress() {
  return (
    <RatingRing progress={0.72} size={120}>
      <Stat size="lg">1248</Stat>
      <Eyebrow className="text-muted-foreground">rating</Eyebrow>
    </RatingRing>
  );
}

export function ToNextRank() {
  return (
    <div className="flex items-center gap-6">
      <RatingRing progress={0.4} size={96}>
        <Stat>40%</Stat>
      </RatingRing>
      <RatingRing progress={0.9} size={96}>
        <Stat>90%</Stat>
      </RatingRing>
    </div>
  );
}
