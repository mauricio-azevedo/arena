import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyH4, TypographyMuted, TypographySmall } from '@/components/ui/typography';
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
      <CardContent>
        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <TypographyH4>{initials}</TypographyH4>
          </div>

          <div className="min-w-0 pt-1">
            <TypographyH4 className="truncate">{fullName}</TypographyH4>
            {user.email ? <TypographyMuted>{user.email}</TypographyMuted> : null}
          </div>
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
