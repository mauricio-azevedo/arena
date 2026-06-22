'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Label, Meta } from '@/components/ui/text';
import { getAccessToken } from '@/lib/auth';
import { createMemberClaimLink } from '../api/members.api';

type StubClaimShareProps = {
  groupId: string;
  memberId: string;
};

// Lets a member generate a single-use link/QR so the person can take over this stub
// (jogador sem conta) and turn it into their own account, keeping all history.
export function StubClaimShare({ groupId, memberId }: StubClaimShareProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the "copied" confirmation after a moment, cleaning up if the drawer closes.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function generate() {
    const token = getAccessToken();

    if (!token) {
      setError('Entre na sua conta para gerar o convite.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const invite = await createMemberClaimLink(token, groupId, memberId);
      setUrl(`${window.location.origin}${invite.path}`);
    } catch {
      setError('Não foi possível gerar o convite. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!url) return;

    try {
      await window.navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError('Não foi possível copiar. Copie o link manualmente.');
    }
  }

  if (!url) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="flex h-11 w-full items-center justify-center rounded-pill bg-surface text-brand shadow-hairline transition-opacity active:opacity-60 disabled:opacity-60"
        >
          <Label className="text-brand">
            {generating ? 'Gerando…' : 'Convidar para assumir este perfil'}
          </Label>
        </button>
        {error && (
          <Meta className="mt-2 block px-1 text-center text-tag-warn">{error}</Meta>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-3 rounded-3xl bg-surface px-4 py-5 shadow-hairline">
      <span className="rounded-2xl bg-white p-3">
        <QRCodeSVG value={url} size={150} marginSize={0} />
      </span>
      <Meta className="w-full break-all text-center text-muted-foreground">{url}</Meta>
      <button
        type="button"
        onClick={copy}
        className="flex h-10 w-full items-center justify-center rounded-pill bg-brand text-brand-foreground transition-opacity active:opacity-60"
      >
        <Label className="text-brand-foreground">
          {copied ? 'Link copiado' : 'Copiar link'}
        </Label>
      </button>
      {error && <Meta className="block text-center text-tag-warn">{error}</Meta>}
    </div>
  );
}
