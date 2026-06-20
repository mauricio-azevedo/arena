import { Toggle } from '@/components/ui/toggle';

export function States() {
  return (
    <div className="flex items-center gap-3">
      <Toggle>Todos</Toggle>
      <Toggle defaultPressed>Só vitórias</Toggle>
      <Toggle variant="outline">Favoritos</Toggle>
    </div>
  );
}
