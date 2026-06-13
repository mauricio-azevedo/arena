import { Activity, ShieldCheck, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  user: ProfileUser;
  isPublicProfile?: boolean;
};

export function ProfileHeader({ user, isPublicProfile = false }: Props) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <header className="rounded-2xl border bg-primary p-5 text-primary-foreground shadow-sm">
      <div className="space-y-5">
        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 text-xl font-semibold">
            {initials}
          </div>

          <div className="min-w-0 pt-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/70">
              {isPublicProfile ? 'Perfil de jogador' : 'Meu perfil'}
            </p>
            <h1 className="mt-2 truncate text-3xl font-semibold leading-tight tracking-[-0.035em]">
              {fullName}
            </h1>
            {user.email ? <p className="mt-1 truncate text-sm text-primary-foreground/70">{user.email}</p> : null}
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

function ProfileSignal({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-xl border border-primary-foreground/16 bg-primary-foreground/10 px-3 py-2">
      <Icon className="h-3.5 w-3.5" />
      <p className="mt-1.5 font-medium text-primary-foreground/80">{label}</p>
    </div>
  );
}
