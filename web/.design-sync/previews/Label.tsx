import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function WithField() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="player">Adicionar jogador</Label>
      <Input id="player" placeholder="Nome ou @usuário" />
    </div>
  );
}
