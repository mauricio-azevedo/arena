import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';

// defaultOpen so the option list renders inside the card.
export function Open() {
  return (
    <Select defaultOpen defaultValue="caio">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Escolher jogador" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Jogadores</SelectLabel>
          <SelectItem value="caio">Caio Ribeiro</SelectItem>
          <SelectItem value="bruno">Bruno Souza</SelectItem>
          <SelectItem value="diego">Diego Lima</SelectItem>
          <SelectItem value="leo">Léo Martins</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
