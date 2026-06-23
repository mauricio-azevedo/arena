import { LogOut } from 'lucide-react';
import { LogoutButton } from '@/features/auth/components/logout-button';

// Full-width "Sair da conta" row for the profile. The confirm dialog and the
// logout flow live in LogoutButton; this only supplies the styled trigger.
export function ProfileLogoutRow() {
  return (
    <LogoutButton
      trigger={
        <button
          type="button"
          className="flex h-[3.125rem] w-full items-center justify-center gap-2 rounded-card bg-surface text-label font-bold text-danger shadow-hairline transition-transform active:scale-[0.98]"
        >
          <LogOut className="size-[1.125rem]" strokeWidth={2.2} aria-hidden />
          Sair da conta
        </button>
      }
    />
  );
}
