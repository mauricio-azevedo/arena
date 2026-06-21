import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DrawerFooter, DrawerTitle } from '@/components/ui/drawer';
import { Label, Meta } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { TOUCH_TARGET_48 } from '@/lib/touch-target';

type ComposeViewProps = {
  title: string;
  groupName: string;
  saveLabel: string;
  canSave: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
  children: ReactNode;
};

export function ComposeView({
  title,
  groupName,
  saveLabel,
  canSave,
  isSubmitting,
  error,
  onCancel,
  onSave,
  children,
}: ComposeViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'min-w-16 text-left text-brand transition-opacity active:opacity-60',
            TOUCH_TARGET_48,
          )}
        >
          <Label className="text-brand">Cancelar</Label>
        </button>

        <div className="text-center">
          <DrawerTitle>{title}</DrawerTitle>
          <Meta className="text-faint-foreground">{groupName}</Meta>
        </div>

        <div className="w-16" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-2 [scrollbar-width:none]">
        {children}
      </div>

      <DrawerFooter className="gap-2.5 pt-2.5 pb-[30px] shadow-[0_-1px_0_var(--surface)]">
        {error && <Meta className="text-center text-danger">{error}</Meta>}
        <Button
          size="lg"
          className="w-full"
          disabled={!canSave || isSubmitting}
          onClick={onSave}
        >
          {isSubmitting ? 'Salvando…' : saveLabel}
        </Button>
      </DrawerFooter>
    </div>
  );
}
