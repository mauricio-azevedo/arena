import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  user: ProfileUser;
  isPublicProfile?: boolean;
};

export function ProfileHeader({ user, isPublicProfile = false }: Props) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <header className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-orange-50 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white shadow-sm ring-4 ring-background">
          {initials}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{fullName}</h1>
          {user.email ? (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          ) : isPublicProfile ? (
            <p className="truncate text-sm text-muted-foreground">Perfil de jogador</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
