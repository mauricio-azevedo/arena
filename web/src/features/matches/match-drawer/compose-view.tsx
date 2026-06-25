import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DrawerActionHeader, DrawerFooter } from '@/components/ui/drawer';
import { Meta } from '@/components/ui/text';

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
      <DrawerActionHeader
        left={{ kind: 'cancel', onClick: onCancel }}
        title={title}
        subtitle={groupName}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-2 [scrollbar-width:none]">
        {children}
      </div>

      <DrawerFooter className="gap-2.5 pt-2.5 pb-[30px] shadow-[0_-1px_0_var(--surface)]">
        {error && <Meta className="text-center text-danger">{error}</Meta>}
        <Button
          size="lg"
          className="w-full"
          loading={isSubmitting}
          disabled={!canSave}
          onClick={onSave}
        >
          {saveLabel}
        </Button>
      </DrawerFooter>
    </div>
  );
}
