'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Body, Meta, Title } from '@/components/ui/text';
import { formatFeedItemTime } from '@/features/feed/helpers/feed-item-time.helper';
import { getAccessToken } from '@/lib/auth';
import {
  approveClaimRequest,
  declineClaimRequest,
  getClaimRequest,
} from '@/features/claim-requests/api/claim-requests.api';
import {
  DashedAvatar,
  GroupBrandChip,
  PersonAvatar,
  PreviewCard,
  PreviewName,
  StatTrio,
} from '@/features/invites/components/claim/claim-shared';
import { nameInitial } from '@/lib/avatar';
import type { ClaimRequestDetail, ClaimRequestStatus } from '@/types/api';

type Status = 'loading' | 'ready' | 'error';

export function ClaimRequestReview({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [detail, setDetail] = useState<ClaimRequestDetail | null>(null);
  const [outcome, setOutcome] = useState<ClaimRequestStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      const token = getAccessToken();
      if (!token) {
        if (isCurrent) setStatus('error');
        return;
      }
      try {
        const data = await getClaimRequest(token, requestId);
        if (!isCurrent) return;
        setDetail(data);
        setOutcome(data.status);
        setStatus('ready');
      } catch {
        if (isCurrent) setStatus('error');
      }
    }

    load();
    return () => {
      isCurrent = false;
    };
  }, [requestId]);

  async function resolve(action: 'approve' | 'decline') {
    const token = getAccessToken();
    if (!token) return;

    setError('');
    setPending(true);
    try {
      if (action === 'approve') {
        await approveClaimRequest(token, requestId);
        setOutcome('APPROVED');
      } else {
        await declineClaimRequest(token, requestId);
        setOutcome('DECLINED');
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível concluir agora. Tente novamente.',
      );
      setPending(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-faint-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (status === 'error' || !detail) {
    return (
      <Body className="py-16 text-center text-muted-foreground">
        Não foi possível carregar esta solicitação.
      </Body>
    );
  }

  if (outcome === 'APPROVED') {
    return (
      <Resolution
        tone="success"
        title="Reivindicação aprovada"
        body={
          <>
            O histórico do perfil{' '}
            <strong className="font-bold text-foreground">{detail.stub.name}</strong> agora é de{' '}
            <strong className="font-bold text-foreground">{detail.requester.name}</strong> em{' '}
            {detail.groupName}.
          </>
        }
        onDone={() => router.push(`/groups/${detail.groupId}`)}
        doneLabel="Concluir"
      />
    );
  }

  if (outcome === 'DECLINED' || outcome === 'CANCELLED') {
    return (
      <Resolution
        tone="muted"
        title="Reivindicação recusada"
        body={
          <>
            <strong className="font-bold text-foreground">{detail.requester.name}</strong> foi
            avisado. O perfil{' '}
            <strong className="font-bold text-foreground">{detail.stub.name}</strong> continua sem
            conta.
          </>
        }
        onDone={() => router.push('/notifications')}
        doneLabel="Voltar"
      />
    );
  }

  // PENDING
  const { stub, requester, groupName, hasConflict } = detail;

  return (
    <div className="flex flex-col gap-6 py-2">
      <GroupBrandChip groupName={groupName} title="Solicitação de reivindicação" />

      <div className="flex items-stretch gap-2">
        <PreviewCard>
          <DashedAvatar initial={nameInitial(stub.name)} className="size-11 text-label" />
          <PreviewName name={stub.name} sub="perfil sem conta" />
        </PreviewCard>
        <div className="flex shrink-0 items-center text-faint-foreground">
          <ArrowRight className="size-5" aria-hidden />
        </div>
        <PreviewCard accent>
          <PersonAvatar
            seed={requester.name}
            name={requester.name}
            accent
            className="size-11 text-label"
          />
          <PreviewName name={requester.name} sub="conta" accent />
        </PreviewCard>
      </div>

      <div className="space-y-2 text-center">
        <Title className="text-foreground">Aprovar reivindicação?</Title>
        <Body className="mx-auto max-w-[20rem] text-muted-foreground">
          <strong className="font-bold text-foreground">{requester.name}</strong> diz ser o perfil{' '}
          <strong className="font-bold text-foreground">{stub.name}</strong>. Aprovar transfere todo
          o histórico dele para esta conta.
        </Body>
      </div>

      <StatTrio rank={stub.rank} rating={stub.rating ?? 0} matchesCount={stub.matchesCount} />

      {hasConflict ? (
        <Banner tone="warn" icon={TriangleAlert}>
          Vocês já jogaram a mesma partida — este perfil não pode ser desta conta.
        </Banner>
      ) : (
        <Banner tone="success" icon={ShieldCheck}>
          Nenhuma partida em comum — pode aprovar com segurança.
        </Banner>
      )}

      <Meta className="block text-center text-faint-foreground">
        Solicitado por {requester.name} · {formatFeedItemTime(detail.createdAt)}
      </Meta>

      {error && <Meta className="block px-2 text-center text-tag-warn">{error}</Meta>}

      <div className="space-y-2.5">
        <Button
          size="lg"
          className="w-full"
          disabled={pending || hasConflict}
          onClick={() => resolve('approve')}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Aprovando…
            </>
          ) : (
            <>
              <Check className="size-4" strokeWidth={2.6} aria-hidden />
              Aprovar reivindicação
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full text-danger"
          disabled={pending}
          onClick={() => resolve('decline')}
        >
          Recusar
        </Button>
      </div>
    </div>
  );
}

function Resolution({
  tone,
  title,
  body,
  onDone,
  doneLabel,
}: {
  tone: 'success' | 'muted';
  title: string;
  body: React.ReactNode;
  onDone: () => void;
  doneLabel: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center pt-12 text-center">
      <div
        className={
          tone === 'success'
            ? 'flex size-[88px] items-center justify-center rounded-full bg-success/15 shadow-[inset_0_0_0_1.5px_var(--success)]'
            : 'flex size-[88px] items-center justify-center rounded-full bg-surface text-muted-foreground shadow-hairline'
        }
      >
        {tone === 'success' ? (
          <Check className="size-11 text-success" strokeWidth={2.8} aria-hidden />
        ) : (
          <X className="size-10" strokeWidth={2.4} aria-hidden />
        )}
      </div>
      <Title className="mt-6 text-foreground">{title}</Title>
      <Body className="mx-auto mt-2 max-w-[19rem] text-muted-foreground">{body}</Body>
      <div className="mt-auto w-full pt-8">
        <Button
          size="lg"
          variant={tone === 'success' ? 'default' : 'secondary'}
          className="w-full"
          onClick={onDone}
        >
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: 'success' | 'warn';
  icon: typeof ShieldCheck;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === 'success'
          ? 'flex items-center gap-2.5 rounded-2xl bg-success/10 px-4 py-3 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--success)_24%,transparent)]'
          : 'flex items-center gap-2.5 rounded-2xl bg-tag-warn/10 px-4 py-3 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--tag-warn)_24%,transparent)]'
      }
    >
      <Icon
        className={
          tone === 'success' ? 'size-5 shrink-0 text-success' : 'size-5 shrink-0 text-tag-warn'
        }
        aria-hidden
      />
      <Meta className={tone === 'success' ? 'text-success' : 'text-tag-warn'}>{children}</Meta>
    </div>
  );
}
