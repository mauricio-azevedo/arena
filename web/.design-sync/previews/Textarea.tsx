import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function Default() {
  return (
    <div className="w-72">
      <Textarea placeholder="Alguma observação sobre a partida?" />
    </div>
  );
}

export function WithLabel() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="notes">Notas do grupo</Label>
      <Textarea
        id="notes"
        defaultValue="Jogos toda quarta às 19h na quadra 2. Confirmar presença até terça."
      />
    </div>
  );
}
