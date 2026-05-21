import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  user: ProfileUser;
  isPublicProfile?: boolean;
};

export function ProfileHeader({ user, isPublicProfile = false }: Props) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <header className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary via-primary/90 to-amber-500 p-5 text-primary-foreground shadow-[0_24px_70px_rgba(126,72,28,0.22)]">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/16 text-2xl font-bold shadow-sm backdrop-blur-sm">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
            {isPublicProfile ? 'Perfil de jogador' : 'Meu perfil'}
          </p>
          <h1 className="mt-1 truncate text-3xl font-semibold tracking-[-0.045em]">{fullName}</h1>
          {user.email ? (
            <p className="mt-1 truncate text-sm text-primary-foreground/72">{user.email}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
