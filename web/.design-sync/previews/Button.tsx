import { Button } from '@/components/ui/button';

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Registrar partida</Button>
      <Button variant="secondary">Ver grupo</Button>
      <Button variant="outline">Convidar</Button>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="destructive">Sair do grupo</Button>
      <Button variant="link">Saiba mais</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg">Grande</Button>
      <Button size="default">Padrão</Button>
      <Button size="sm">Pequeno</Button>
      <Button size="xs">Mini</Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Ativo</Button>
      <Button disabled>Desabilitado</Button>
      <Button variant="secondary" disabled>
        Indisponível
      </Button>
    </div>
  );
}
