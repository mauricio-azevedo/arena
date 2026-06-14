import { Activity, ShieldCheck, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyH1, TypographyMuted, TypographySmall } from '@/components/ui/typography';
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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <TypographyH4>{initials}</TypographyH4>
          </div>

          <div className="min-w-0 pt-1">
            <TypographySmall>{isPublicProfile ? 'Perfil de jogador' : 'Meu perfil'}</TypographySmall>
            <TypographyH1>{fullName}</TypographyH1>
            {user.email ? <TypographyMuted>{user.email}</TypographyMuted> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
      <TypographySmall>{label}</TypographySmall>
    </div>
  );
}
