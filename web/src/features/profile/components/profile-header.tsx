import { Activity, ShieldCheck, Trophy } from 'lucide-react';
import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  user: ProfileUser;
  isPublicProfile?: boolean;
};

export function ProfileHeader({ user, isPublicProfile = false }: Props) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <header className="relative overflow-hidden rounded-[2.6rem] bg-foreground p-5 text-background shadow-[0_30px_90px_color-mix(in_oklch,var(--foreground)_24%,transparent)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklch,var(--primary)_70%,transparent),transparent_34%),radial-gradient(circle_at_90%_20%,color-mix(in_oklch,var(--accent)_70%,transparent),transparent_30%)]" />
      <div className="absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

      <div className="relative space-y-5">
        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] border border-white/16 bg-white/14 text-2xl font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl">
            {initials}
          </div>

          <div className="min-w-0 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-background/62">
              {isPublicProfile ? 'Perfil de jogador' : 'Meu perfil'}
            </p>
            <h1 className="mt-2 truncate text-[2.1rem] font-semibold leading-none tracking-[-0.065em]">
              {fullName}
            </h1>
            {user.email ? <p className="mt-2 truncate text-sm text-background/64">{user.email}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <ProfileSignal icon={Trophy} label="Ranking" />
          <ProfileSignal icon={Activity} label="Histórico" />
          <ProfileSignal icon={ShieldCheck} label="Conta" />
        </div>
      </div>
    </header>
  );
}

function ProfileSignal({ icon: Icon, label }: { icon: typeof Trophy; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/12 bg-white/12 px-3 py-2 backdrop-blur-xl">
      <Icon className="h-3.5 w-3.5" />
      <p className="mt-1.5 font-semibold text-background/78">{label}</p>
    </div>
  );
}
