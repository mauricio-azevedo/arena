'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';
import { DrawerBackHeader } from '@/components/ui/drawer';
import { Body, Label, Meta } from '@/components/ui/text';
import { getAccessToken } from '@/lib/auth';
import type { ClaimEmailState } from '@/types/api';
import {
  clearClaimEmail,
  getClaimEmailState,
  setClaimEmail,
} from '@/features/claim-offers/api/claim-offers.api';

type Props = {
  groupId: string;
  memberId: string;
  stubName: string;
  onBack: () => void;
};

// "Vincular conta": an admin anchors an email to a stub. Whoever owns (or later
// registers) that email gets an in-app invite to confirm and take over the history.
export function StubClaimEmailPanel({ groupId, memberId, stubName, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ClaimEmailState | null>(null);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      const token = getAccessToken();
      if (!token) {
        if (isCurrent) setLoading(false);
        return;
      }
      try {
        const data = await getClaimEmailState(token, groupId, memberId);
        if (isCurrent) {
          setState(data);
          setEmail(data.email ?? '');
        }
      } catch {
        // Leaves the form empty; the admin can still set an email.
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    load();
    return () => {
      isCurrent = false;
    };
  }, [groupId, memberId]);

  async function save() {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const next = await setClaimEmail(token, groupId, memberId, email.trim());
      setState(next);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível vincular agora. Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const next = await clearClaimEmail(token, groupId, memberId);
      setState(next);
      setEmail('');
    } catch {
      setError('Não foi possível remover agora.');
    } finally {
      setSaving(false);
    }
  }

  const pending = state?.status === 'PENDING';
  const declined = state?.status === 'DECLINED';
  const dirty = email.trim().toLowerCase() !== (state?.email ?? '');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerBackHeader onBack={onBack} title="Convidar" subtitle={stubName} />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-1 [scrollbar-width:none]">
        <Body className="text-muted-foreground">
          Convide <span className="font-bold text-foreground">{stubName}</span> pro grupo pelo
          email. Quando existir uma conta com esse email — agora ou quando ele se cadastrar — ele
          entra e as partidas dele vêm junto.
        </Body>

        {loading ? (
          <div className="mt-8 flex justify-center text-faint-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          <>
            {(pending || declined) && state?.email && (
              <div
                className={
                  declined
                    ? 'mt-5 flex items-start gap-2.5 rounded-2xl bg-tag-warn/[0.08] px-3.5 py-3 ring-1 ring-inset ring-tag-warn/20'
                    : 'mt-5 flex items-start gap-2.5 rounded-2xl bg-success/[0.08] px-3.5 py-3 ring-1 ring-inset ring-success/20'
                }
              >
                {declined ? (
                  <Mail className="mt-px size-4 shrink-0 text-tag-warn" aria-hidden />
                ) : (
                  <Check className="mt-px size-4 shrink-0 text-success" aria-hidden />
                )}
                <Meta
                  className={declined ? 'text-left text-tag-warn/90' : 'text-left text-success'}
                >
                  {declined
                    ? `${state.email} disse que não é esse perfil. Tente outro email.`
                    : state.accountExists
                      ? `Convite enviado para ${state.email}.`
                      : `Assim que ${state.email} tiver uma conta, o convite chega.`}
                </Meta>
              </div>
            )}

            <div className="mt-5 flex h-[46px] items-center gap-2.5 rounded-pill bg-surface px-4 shadow-hairline">
              <Mail
                className="size-[18px] shrink-0 text-faint-foreground"
                strokeWidth={2.2}
                aria-hidden
              />
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                placeholder="email@exemplo.com"
                className="min-w-0 flex-1 bg-transparent text-body font-semibold text-foreground outline-none placeholder:text-faint-foreground"
              />
            </div>

            {error && <Meta className="mt-2 block px-1 text-center text-tag-warn">{error}</Meta>}

            <button
              type="button"
              onClick={save}
              disabled={saving || !email.trim() || !dirty}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand text-brand-foreground shadow-button transition-opacity active:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin text-brand-foreground" aria-hidden />
              ) : (
                <Label className="text-brand-foreground">
                  {state?.email ? 'Atualizar email' : 'Enviar convite'}
                </Label>
              )}
            </button>

            {state?.email && (
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="mt-2 flex h-11 w-full items-center justify-center transition-opacity active:opacity-60 disabled:opacity-50"
              >
                <Label className="text-muted-foreground">Remover email</Label>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
