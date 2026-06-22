'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Check, Loader2 } from 'lucide-react';
import { DrawerBackHeader } from '@/components/ui/drawer';
import { Label, Meta } from '@/components/ui/text';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

type StubClaimPanelProps = {
  name: string;
  // The single-use claim link, minted by the parent on open. Null while pending.
  url: string | null;
  error: string | null;
  onBack: () => void;
};

// The claim flow as a nested drawer: a single-use link + QR so the person can take
// over this stub (jogador sem conta) and turn it into their own account, keeping
// all history. Presentational — the parent mints the link and owns its state.
export function StubClaimPanel({ name, url, error, onBack }: StubClaimPanelProps) {
  const { copied, failed: copyFailed, copy } = useCopyToClipboard();
  // While there's no link and no error, the parent's mint is still in flight.
  const generating = !url && !error;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerBackHeader onBack={onBack} title={`Convidar ${name}`} />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 [scrollbar-width:none]">
        <Meta className="mx-auto block max-w-[18rem] text-center text-muted-foreground">
          Quando {name} entrar pelo convite, assume este perfil — com todo o
          histórico.
        </Meta>

        {generating ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-faint-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <Meta className="text-faint-foreground">Gerando convite…</Meta>
          </div>
        ) : url ? (
          <div className="mt-5 flex flex-col gap-3">
            {/* QR — scan on the spot */}
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-4 py-5 shadow-float">
              <QRCodeSVG value={url} size={172} marginSize={0} />
              <span className="text-center text-xs font-bold text-stone-500">
                Aponte a câmera para escanear na quadra
              </span>
            </div>

            {/* link + copy */}
            <div className="flex items-center gap-2 rounded-2xl bg-surface py-2 pl-4 pr-2 shadow-hairline">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-muted-foreground">
                {url}
              </span>
              <button
                type="button"
                onClick={() => copy(url)}
                className="flex h-9 shrink-0 items-center rounded-xl bg-background px-4 shadow-hairline transition-opacity active:opacity-60"
              >
                <Label className="text-foreground">{copied ? 'Copiado' : 'Copiar'}</Label>
              </button>
            </div>

            {copyFailed && (
              <Meta className="px-1 text-center text-tag-warn">
                Não foi possível copiar. Copie o link acima manualmente.
              </Meta>
            )}

            <div className="flex items-start gap-2">
              <Check className="mt-px size-4 shrink-0 text-success" aria-hidden />
              <Meta className="text-left text-faint-foreground">
                Ao entrar pelo convite, o histórico passa para a conta dele — nada
                se perde.
              </Meta>
            </div>
          </div>
        ) : null}

        {error && <Meta className="mt-4 block text-center text-tag-warn">{error}</Meta>}
      </div>
    </div>
  );
}
