'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Search, Send } from 'lucide-react';
import { DrawerBackHeader } from '@/components/ui/drawer';
import { Label, Meta } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { getAccessToken } from '@/lib/auth';
import type { UserSearchResult } from '@/types/api';
import { inviteUserToClaim, searchUsers } from '../api/members.api';

type Props = {
  groupId: string;
  memberId: string;
  stubName: string;
  onBack: () => void;
};

// Nested "Enviar pelo app" sheet: an admin searches platform users and sends one an
// in-app invite to take over this stub. The invite carries a single-use claim link.
export function StubInviteSearchPanel({ groupId, memberId, stubName, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    // Guards against an earlier, slower response landing after a newer query.
    let active = true;

    const timer = setTimeout(() => {
      const term = query.trim();
      if (term.length < 2 || !token) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      searchUsers(token, term)
        .then((users) => {
          if (active) setResults(users);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  function invite(user: UserSearchResult) {
    const token = getAccessToken();
    if (!token) return;

    setSendingId(user.id);
    setError(null);

    const name = `${user.firstName} ${user.lastName}`.trim();
    inviteUserToClaim(token, groupId, memberId, user.id)
      .then(() => setSentTo(name))
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : 'Não foi possível enviar o convite. Tente novamente.',
        ),
      )
      .finally(() => setSendingId(null));
  }

  if (sentTo) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <DrawerBackHeader onBack={onBack} title={`Convidar ${stubName}`} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="size-7" strokeWidth={2.6} aria-hidden />
          </span>
          <Label className="text-foreground">Convite enviado para {sentTo}</Label>
          <Meta className="text-muted-foreground">
            {sentTo} vai receber um convite no app para assumir {stubName}.
          </Meta>
        </div>
      </div>
    );
  }

  const term = query.trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerBackHeader
        onBack={onBack}
        title={`Convidar ${stubName}`}
        subtitle="Buscar pessoa no app"
      />

      <div className="shrink-0 px-[18px] pb-3 pt-1">
        <div className="flex h-[46px] items-center gap-2.5 rounded-pill bg-surface px-4 shadow-hairline">
          <Search
            className="size-[18px] shrink-0 text-faint-foreground"
            strokeWidth={2.2}
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome ou e-mail"
            className="min-w-0 flex-1 bg-transparent text-body font-semibold text-foreground outline-none placeholder:text-faint-foreground"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[30px] [scrollbar-width:none]">
        {searching ? (
          <div className="mt-7 flex justify-center text-faint-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : results.length > 0 ? (
          <div className="overflow-hidden rounded-3xl bg-surface shadow-hairline">
            {results.map((user) => {
              const name = `${user.firstName} ${user.lastName}`.trim();
              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={sendingId !== null}
                  onClick={() => invite(user)}
                  className="flex w-full items-center gap-3 border-t border-divider px-4 py-3 text-left first:border-t-0 disabled:opacity-50"
                >
                  <span
                    className={cn(
                      'flex size-[42px] shrink-0 items-center justify-center rounded-full text-meta font-extrabold text-foreground shadow-[inset_0_0_0_1px_var(--border)]',
                      avatarBgClass(user.id),
                    )}
                    aria-hidden
                  >
                    {nameInitial(name)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Label className="truncate text-foreground">{name}</Label>
                    {user.email && (
                      <Meta className="truncate text-muted-foreground">{user.email}</Meta>
                    )}
                  </div>
                  {sendingId === user.id ? (
                    <Loader2
                      className="size-4 shrink-0 animate-spin text-faint-foreground"
                      aria-hidden
                    />
                  ) : (
                    <Send className="size-4 shrink-0 text-brand" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        ) : term.length >= 2 ? (
          <Meta className="mt-7 block text-center text-faint-foreground">Ninguém encontrado.</Meta>
        ) : (
          <Meta className="mt-7 block text-center text-faint-foreground">
            Busque por nome ou e-mail para convidar.
          </Meta>
        )}

        {error && <Meta className="mt-3 block text-center text-tag-warn">{error}</Meta>}
      </div>
    </div>
  );
}
