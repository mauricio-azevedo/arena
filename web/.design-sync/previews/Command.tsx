import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

// cmdk renders inline (no portal) — a real command palette.
export function Palette() {
  return (
    <Command className="w-80 rounded-2xl bg-surface shadow-card">
      <CommandInput placeholder="Buscar grupo, jogador ou ação…" />
      <CommandList>
        <CommandGroup heading="Grupos">
          <CommandItem>Beach Tennis Sábado</CommandItem>
          <CommandItem>Treino de Quarta</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações">
          <CommandItem>
            Registrar partida
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>Convidar jogador</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
