import { Badge } from '@/components/ui/badge';

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Padrão</Badge>
      <Badge variant="secondary">Secundário</Badge>
      <Badge variant="outline">Contorno</Badge>
    </div>
  );
}

export function Semantic() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="brand">#3</Badge>
      <Badge variant="success">+12</Badge>
      <Badge variant="danger">−5</Badge>
    </div>
  );
}
