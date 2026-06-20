import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox';

const players = [
  { value: 'caio', label: 'Caio Ribeiro' },
  { value: 'bruno', label: 'Bruno Souza' },
  { value: 'diego', label: 'Diego Lima' },
  { value: 'leo', label: 'Léo Martins' },
];

export function Open() {
  return (
    <div className="w-72">
      <Combobox items={players} defaultOpen autoHighlight>
        <ComboboxInput placeholder="Buscar jogador" />
        <ComboboxContent>
          <ComboboxEmpty>Nenhum jogador encontrado.</ComboboxEmpty>
          <ComboboxList>
            {(option: { value: string; label: string }) => (
              <ComboboxItem key={option.value} value={option}>
                <span className="truncate">{option.label}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
