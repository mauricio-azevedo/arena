import { Activity, ArrowUpRight, Sparkles, Trophy, UsersRound, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { HomeFeed } from '@/features/feed/home-feed';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2.6rem] bg-foreground p-5 text-background shadow-[0_30px_90px_color-mix(in_oklch,var(--foreground)_24%,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,color-mix(in_oklch,var(--primary)_70%,transparent),transparent_34%),radial-gradient(circle_at_92%_18%,color-mix(in_oklch,var(--accent)_65%,transparent),transparent_30%),linear-gradient(150deg,transparent,rgba(255,255,255,0.08))]" />
          <div className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-background/86 backdrop-blur-xl">
                <Waves className="h-3.5 w-3.5" />
                BeachRank
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div>
              <h1 className="text-balance text-[2.75rem] font-semibold leading-[0.9] tracking-[-0.075em]">
                Jogue leve. Compita bonito.
              </h1>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-6 text-background/72">
                Grupos, partidas, feed e ranking com a sensação de um produto nativo — rápido de
                usar entre um jogo e outro.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <HeroMetric icon={UsersRound} label="Grupos" value="social" />
              <HeroMetric icon={Trophy} label="Ranking" value="vivo" />
              <HeroMetric icon={Activity} label="Feed" value="agora" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/75">
                Agora
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">Momentos recentes</h2>
            </div>

            <div className="hidden items-center gap-1 rounded-full bg-white/40 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-xl min-[390px]:inline-flex dark:bg-white/10">
              ao vivo
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>

          <HomeFeed />
        </section>
      </div>
    </AppShell>
  );
}

function HeroMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/12 bg-white/12 p-3 backdrop-blur-xl">
      <Icon className="h-4 w-4" />
      <p className="mt-2 font-semibold">{label}</p>
      <p className="mt-0.5 text-[11px] text-background/58">{value}</p>
    </div>
  );
}
