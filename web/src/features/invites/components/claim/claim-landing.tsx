import Link from 'next/link';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Body, Label, Meta, Title } from '@/components/ui/text';
import { nameInitial } from '@/lib/avatar';
import type { ClaimStubSummary } from '@/types/api';
import {
  DashedAvatar,
  GroupBrandChip,
  PersonAvatar,
  RecentMatches,
  StatTrio,
} from './claim-shared';

export type ClaimMode = 'logged-out' | 'claim' | 'merge';

type ClaimLandingProps = {
  groupName: string;
  stub: ClaimStubSummary;
  mode: ClaimMode;
  // The signed-in person's name, for the merge preview (claim/merge modes).
  meName: string | null;
  pending: boolean;
  error: string | null;
  loginHref: string;
  registerHref: string;
  onAssume: () => void;
  onReject: () => void;
};

export function ClaimLanding({
  groupName,
  stub,
  mode,
  meName,
  pending,
  error,
  loginHref,
  registerHref,
  onAssume,
  onReject,
}: ClaimLandingProps) {
  const subtitle =
    mode === 'merge'
      ? 'Você já joga neste grupo. Assuma este perfil — o histórico passa a ser seu.'
      : 'Você foi convidado para assumir o histórico deste perfil.';

  return (
    <div className="flex flex-col gap-7 py-2">
      <GroupBrandChip groupName={groupName} />

      <div className="flex flex-col items-center gap-4 text-center">
        <DashedAvatar initial={nameInitial(stub.displayName)} className="size-[88px] text-stat-xl" />
        <div className="space-y-2">
          <Title className="text-balance text-foreground">
            Assuma o perfil {stub.displayName}
          </Title>
          <Body className="mx-auto max-w-[18rem] text-muted-foreground">{subtitle}</Body>
        </div>
      </div>

      <StatTrio rank={stub.rank} rating={stub.rating} matchesCount={stub.matchesCount} />

      <RecentMatches matches={stub.recentMatches} />

      {mode === 'logged-out' ? (
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href={registerHref}>Criar conta e assumir</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full">
            <Link href={loginHref}>Já tenho conta</Link>
          </Button>
          <div className="flex items-start gap-2 px-1 pt-1">
            <Lock className="mt-px size-3.5 shrink-0 text-faint-foreground" aria-hidden />
            <Meta className="text-left text-faint-foreground">
              Só quem tem este link pode assumir o perfil. O vínculo é definitivo.
            </Meta>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {meName && (
            <MergePreview
              stubName={stub.displayName}
              meName={meName}
              meSub={mode === 'merge' ? 'você já joga aqui' : 'sua conta'}
            />
          )}
          <Button size="lg" className="w-full" disabled={pending} onClick={onAssume}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Assumindo…
              </>
            ) : mode === 'merge' ? (
              'Assumir perfil'
            ) : (
              'Sou eu — assumir perfil'
            )}
          </Button>
          <Meta className="block px-2 text-center text-faint-foreground">
            {mode === 'merge'
              ? 'Seus dois perfis neste grupo passam a ser um só.'
              : 'Você entra no grupo assumindo este perfil.'}
          </Meta>
          {error && <Meta className="block px-2 text-center text-tag-warn">{error}</Meta>}
          <button
            type="button"
            onClick={onReject}
            className="flex h-11 w-full items-center justify-center text-muted-foreground transition-opacity active:opacity-60"
          >
            <Label>Não sou {stub.displayName}</Label>
          </button>
        </div>
      )}
    </div>
  );
}

// stub (faceless) → you (account): the two profiles about to become one.
function MergePreview({
  stubName,
  meName,
  meSub,
}: {
  stubName: string;
  meName: string;
  meSub: string;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <PreviewCard>
        <DashedAvatar initial={nameInitial(stubName)} className="size-[42px] text-label" />
        <PreviewName name={stubName} sub="perfil do grupo" />
      </PreviewCard>
      <div className="flex shrink-0 items-center text-faint-foreground">
        <ArrowRight className="size-5" aria-hidden />
      </div>
      <PreviewCard accent>
        <PersonAvatar seed={meName} name={meName} accent className="size-[42px] text-label" />
        <PreviewName name={meName} sub={meSub} accent />
      </PreviewCard>
    </div>
  );
}

function PreviewCard({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? 'flex min-w-0 flex-1 flex-col items-center gap-2 rounded-3xl bg-brand/10 px-2 py-3.5 shadow-[inset_0_0_0_1.5px_var(--brand)]'
          : 'flex min-w-0 flex-1 flex-col items-center gap-2 rounded-3xl bg-surface px-2 py-3.5 shadow-hairline'
      }
    >
      {children}
    </div>
  );
}

function PreviewName({
  name,
  sub,
  accent,
}: {
  name: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="w-full min-w-0 text-center">
      <Label className="block truncate text-foreground">{name}</Label>
      <Meta className={accent ? 'block truncate text-brand' : 'block truncate text-faint-foreground'}>
        {sub}
      </Meta>
    </div>
  );
}
