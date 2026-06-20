import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// The items are round 40px controls — a natural fit for picking a game score.
export function GamesWon() {
  return (
    <ToggleGroup type="single" defaultValue="6" variant="outline">
      <ToggleGroupItem value="4">4</ToggleGroupItem>
      <ToggleGroupItem value="5">5</ToggleGroupItem>
      <ToggleGroupItem value="6">6</ToggleGroupItem>
      <ToggleGroupItem value="7">7</ToggleGroupItem>
    </ToggleGroup>
  );
}

export function Multiple() {
  return (
    <ToggleGroup type="multiple" defaultValue={['1', '3']} variant="outline">
      <ToggleGroupItem value="1">1º</ToggleGroupItem>
      <ToggleGroupItem value="2">2º</ToggleGroupItem>
      <ToggleGroupItem value="3">3º</ToggleGroupItem>
    </ToggleGroup>
  );
}
