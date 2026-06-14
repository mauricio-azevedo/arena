import { Activity, ShieldCheck, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  user: ProfileUser;
  isPublicProfile?: boolean;
};

export function ProfileHeader({ user, isPublicProfile = false }: Props) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center text-xl font-semibold">
            {initials}
          </div>

          <div className="min-w-0 pt-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {isPublicProfile ? 'Perfil de jogador' : 'Meu perfil'}
            </p>
            <h1 className="mt-2 truncate text-3xl font-semibold leading-tight tracking-[-0.035em]">
              {fullName}
            </h1>
            {user.email ? <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <ProfileSignal icon={Trophy} label="Ranking" />
          <ProfileSignal icon={Activity} label="Histórico" />
          <ProfileSignal icon={ShieldCheck} label="Conta" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSignal({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="px-3 py-2">
      <Icon className="h-3.5 w-3.5" />
      <p className="mt-1.5 font-medium">{label}</p>
    </div>
  );
}
