import { Activity, Trophy, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { HomeFeed } from '@/features/feed/home-feed';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary via-primary/90 to-amber-500 p-5 text-primary-foreground shadow-[0_24px_70px_rgba(126,72,28,0.25)]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">
                BeachRank
              </p>
              <h1 className="mt-2 text-balance text-4xl font-semibold tracking-[-0.055em]">
                Ranking casual com cara de jogo sério.
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-primary-foreground/78">
                Acompanhe grupos, partidas e evolução dos jogadores sem transformar o beach tennis
                em planilha.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <HeroMetric icon={UsersRound} label="Grupos" />
              <HeroMetric icon={Trophy} label="Ranking" />
              <HeroMetric icon={Activity} label="Feed" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                Agora
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.035em]">Movimento recente</h2>
            </div>
          </div>

          <HomeFeed />
        </section>
      </div>
    </AppShell>
  );
}

function HeroMetric({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-2xl border border-white/16 bg-white/12 p-3 backdrop-blur-sm">
      <Icon className="h-4 w-4" />
      <p className="mt-2 font-medium">{label}</p>
    </div>
  );
}
