'use client';

import { type ReactNode, useState } from 'react';
import { LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { removeAccessToken } from '@/lib/auth';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  // Custom trigger (e.g. a full-width profile row); falls back to the default
  // "Sair" button. Lets callers restyle the trigger while the confirm dialog and
  // the logout flow stay single-source here.
  trigger?: ReactNode;
};

export function LogoutButton({ className, trigger }: Props) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogout() {
    setIsLoggingOut(true);
    removeAccessToken();
    // Hard reset to public home so every client token-read flips to signed-out.
    window.location.assign('/');
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm" className={cn('gap-1.5', className)}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent aria-describedby={undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoggingOut}
            onClick={(event) => {
              event.preventDefault();
              handleLogout();
            }}
          >
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
