'use client';

import { Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Display, Eyebrow, Section, Stat, Title } from '@/components/ui/text';
import { StandingCard } from '@/features/groups/components/standing-card';
import { MatchCard } from '@/features/matches/components/matches-list';
import type { Match, MatchPlayer, MatchTeam } from '@/types/api';

/**
 * Internal design-system reference. Not part of the product surface — it exists
 * so we can see every token and primitive in one place while rolling the style
 * across the app. Self-contained: no API, no auth.
 */
export default function StylePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[460px] px-5 py-10">
      <Eyebrow>Design System</Eyebrow>
      <Title className="mt-1">Arena</Title>
      <p className="mt-2 text-sm text-muted-foreground">
        Tokens e componentes base. Edite os valores em{' '}
        <code className="rounded bg-surface px-1 py-0.5 text-faint-foreground">globals.css</code>.
      </p>

      <Block label="Fontes">
        <div className="space-y-4">
          <div>
            <Eyebrow>Display — Archivo</Eyebrow>
            <div className="font-display text-[34px] font-extrabold tabular-nums">0123456789</div>
          </div>
          <div>
            <Eyebrow>Corpo — Plus Jakarta Sans</Eyebrow>
            <div className="text-[17px] font-medium">
              Grupos, partidas e ranking de beach tennis.
            </div>
          </div>
        </div>
      </Block>

      <Block label="Escala de tipo">
        <div className="space-y-4">
          <Row name="display"><Display>#5</Display></Row>
          <Row name="stat-lg"><Stat size="lg">1017</Stat></Row>
          <Row name="stat"><Stat>−22</Stat></Row>
          <Row name="title"><Title>Masculino Life</Title></Row>
          <Row name="section"><Section>Hoje</Section></Row>
          <Row name="body"><span className="text-body">Grupos e partidas de beach tennis</span></Row>
          <Row name="body-strong"><span className="text-body-strong">Kenio</span></Row>
          <Row name="label"><span className="text-label text-muted-foreground">19 membros</span></Row>
          <Row name="support"><span className="text-support text-faint-foreground">Grupo de amigos do sábado de manhã</span></Row>
          <Row name="eyebrow"><Eyebrow>Sua posição</Eyebrow></Row>
        </div>
      </Block>

      <Block label="Cores">
        <div className="grid grid-cols-3 gap-3">
          <Swatch name="background" className="bg-background" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="divider" className="bg-divider" />
          <Swatch name="foreground" className="bg-foreground" />
          <Swatch name="muted-fg" className="bg-muted-foreground" />
          <Swatch name="faint" className="bg-faint-foreground" />
          <Swatch name="brand" className="bg-brand" />
          <Swatch name="brand-muted" className="bg-brand-muted" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="danger" className="bg-danger" />
        </div>
      </Block>

      <Block label="Card de classificação">
        <StandingCard
          rank={5}
          progress={0.83}
          pointsToClimb={2}
          rating={1017}
          todayDelta={-22}
          movement={{ direction: 'DOWN', positions: 3 }}
        />
      </Block>

      <Block label="Card de partida">
        <MatchCard match={DEMO_MATCH} canManage={false} />
      </Block>

      <Block label="Botões">
        <div className="flex flex-wrap gap-3">
          <Button size="lg">
            <Plus />
            Registrar partida
          </Button>
          <Button variant="secondary">Convidar</Button>
          <Button variant="outline">Editar</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="destructive">Excluir</Button>
        </div>
      </Block>

      <Block label="Campos">
        <div className="space-y-3">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Buscar jogador ou partida" />
          </InputGroup>
          <Input placeholder="Nome do grupo" />
        </div>
      </Block>

      <Block label="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Padrão</Badge>
          <Badge variant="brand">±8</Badge>
          <Badge variant="success">↑3</Badge>
          <Badge variant="danger">↓3</Badge>
          <Badge variant="secondary">26 partidas</Badge>
          <Badge variant="outline">Admin</Badge>
        </div>
      </Block>

      <Block label="Abas">
        <Tabs defaultValue="ranking">
          <TabsList variant="line">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="partidas">Partidas</TabsTrigger>
          </TabsList>
        </Tabs>
      </Block>

      <Block label="Card">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <Eyebrow>Rating atual</Eyebrow>
              <Stat className="mt-1">1017</Stat>
            </div>
            <Stat className="text-danger">−22</Stat>
          </CardContent>
        </Card>
      </Block>
    </main>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 border-b border-divider pb-2 text-eyebrow uppercase text-faint-foreground">
        {label}
      </div>
      {children}
    </section>
  );
}

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      <code className="w-20 shrink-0 text-caption text-faint-foreground">{name}</code>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const TS = '2026-06-18T20:00:00.000Z';

function demoPlayer(
  team: MatchTeam,
  position: number,
  firstName: string,
  rankBefore: number,
  rankAfter: number,
  ratingDelta: number,
): MatchPlayer {
  const id = `${team}-${position}`;
  return {
    id,
    matchId: 'demo',
    groupId: 'demo',
    groupMemberId: id,
    team,
    position,
    ratingBefore: 1000,
    ratingAfter: 1000 + ratingDelta,
    ratingDelta,
    rankBefore,
    rankAfter,
    rankDelta: rankAfter - rankBefore,
    movementDirection: rankAfter === rankBefore ? null : rankAfter < rankBefore ? 'UP' : 'DOWN',
    movementPositions: Math.abs(rankAfter - rankBefore) || null,
    ratingDeviationBefore: null,
    ratingDeviationAfter: null,
    ratingVolatilityBefore: null,
    ratingVolatilityAfter: null,
    ratingMuBefore: null,
    ratingMuAfter: null,
    ratingSigmaBefore: null,
    ratingSigmaAfter: null,
    playedAt: TS,
    createdAt: TS,
    updatedAt: TS,
    groupMember: {
      id,
      groupId: 'demo',
      userId: id,
      rating: 1000,
      ratingDeviation: null,
      ratingVolatility: null,
      ratingMu: null,
      ratingSigma: null,
      ratingAlgorithm: 'BEACH_ELO_V1',
      role: 'MEMBER',
      leftAt: null,
      createdAt: TS,
      updatedAt: TS,
      user: { id, firstName, lastName: '', email: null, createdAt: TS, updatedAt: TS },
    },
  };
}

const DEMO_MATCH: Match = {
  id: 'demo',
  groupId: 'demo',
  gamesA: 6,
  gamesB: 0,
  winnerTeam: 'TEAM_A',
  teamAExpected: 0.3,
  teamBExpected: 0.7,
  teamAActual: 1,
  teamBActual: 0,
  teamARatingBefore: 2000,
  teamBRatingBefore: 2050,
  teamARatingAfter: 2016,
  teamBRatingAfter: 2034,
  ratingAlgorithm: 'BEACH_ELO_V1',
  playedAt: TS,
  createdAt: TS,
  updatedAt: TS,
  players: [
    demoPlayer('TEAM_A', 1, 'Kenio', 19, 19, 8),
    demoPlayer('TEAM_A', 2, 'Lucas', 18, 18, 8),
    demoPlayer('TEAM_B', 1, 'Samuel', 1, 1, -8),
    demoPlayer('TEAM_B', 2, 'Maurício', 2, 5, -8),
  ],
};

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-12 rounded-xl border border-divider ${className}`} />
      <code className="block text-caption text-faint-foreground">{name}</code>
    </div>
  );
}
