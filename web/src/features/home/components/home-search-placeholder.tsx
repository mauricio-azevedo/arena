import { Search } from 'lucide-react';
import { Body } from '@/components/ui/text';

// Placeholder: a busca ainda não tem endpoint. Elemento visual, inerte (não é um input).
export function HomeSearchPlaceholder() {
  return (
    <div
      aria-hidden
      className="flex h-12 items-center gap-2.5 rounded-pill bg-surface px-4 shadow-hairline"
    >
      <Search className="size-[1.125rem] text-faint-foreground" strokeWidth={2.2} aria-hidden />
      <Body className="text-faint-foreground">Buscar grupo ou jogador</Body>
    </div>
  );
}
