'use client';

import { ChevronRight, KeyRound, LogOut, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { Button } from '@/components/ui/button';
import { DrawerActionHeader } from '@/components/ui/drawer';
import { Label, Overline } from '@/components/ui/text';

// The settings sheet's root view: account actions, then logout. Tapping a row
// swaps the sheet to that view (handled by the parent); the sheet is dismissed by
// swipe-down or scrim tap, so no close button is needed.
export function SettingsMenuView({
  onEdit,
  onPassword,
}: {
  onEdit: () => void;
  onPassword: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerActionHeader title="Configurações" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Overline className="mb-3 block px-1 text-faint-foreground">Conta</Overline>

        <div className="overflow-hidden rounded-card bg-surface shadow-hairline">
          <Row icon={<UserRound className="size-[1.125rem]" strokeWidth={2.2} />} onClick={onEdit}>
            Editar perfil
          </Row>
          <div className="h-px bg-border" />
          <Row
            icon={<KeyRound className="size-[1.125rem]" strokeWidth={2.2} />}
            onClick={onPassword}
          >
            Alterar senha
          </Row>
        </div>

        <LogoutButton
          trigger={
            <Button variant="secondary" size="lg" className="mt-comfortable w-full text-danger">
              <LogOut aria-hidden />
              Sair da conta
            </Button>
          }
        />
      </div>
    </div>
  );
}

function Row({
  icon,
  onClick,
  children,
}: {
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-foreground/[0.03]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground">
        {icon}
      </span>
      <Label className="min-w-0 flex-1 truncate font-bold">{children}</Label>
      <ChevronRight
        className="size-5 shrink-0 text-faint-foreground"
        strokeWidth={2.2}
        aria-hidden
      />
    </button>
  );
}
