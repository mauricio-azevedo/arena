import { Search, ArrowRight } from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

export function Search_() {
  return (
    <div className="w-80">
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput placeholder="Buscar jogador ou grupo" />
      </InputGroup>
    </div>
  );
}

export function WithAction() {
  return (
    <div className="w-80">
      <InputGroup>
        <InputGroupInput placeholder="Código do convite" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>
            Entrar
            <ArrowRight />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
