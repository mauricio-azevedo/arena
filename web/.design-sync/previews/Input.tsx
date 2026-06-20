import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Default() {
  return (
    <div className="w-72">
      <Input placeholder="Nome do grupo" />
    </div>
  );
}

export function WithLabel() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="group-name">Nome do grupo</Label>
      <Input id="group-name" defaultValue="Beach Tennis Sábado" />
    </div>
  );
}

export function Invalid() {
  return (
    <div className="w-72">
      <Input aria-invalid defaultValue="aa" placeholder="Mínimo 3 caracteres" />
    </div>
  );
}
