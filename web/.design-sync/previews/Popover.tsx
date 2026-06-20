import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function Open() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="secondary">Sobre o rating</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Como o rating muda</PopoverTitle>
          <PopoverDescription>
            Cada partida ajusta o rating das duas duplas conforme o resultado e a
            diferença de força.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
