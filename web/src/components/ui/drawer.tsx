'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { TOUCH_TARGET_48 } from '@/lib/touch-target';
import { Label, Meta } from '@/components/ui/text';

/**
 * Bottom-sheet drawer (vaul). Tuned for the Arena dark surfaces: a dim overlay,
 * a rounded `--radius-sheet` top, an inset hairline, and a grabber. The sheet
 * leaves a peek at the top so the page behind stays visible, matching the
 * approved match-compose prototype.
 */

function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

// Stacks a second sheet on top of an open drawer: vaul scales the parent back and
// animates this one up/down. Must be rendered inside the parent Drawer's subtree.
function DrawerNested({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.NestedRoot>) {
  return <DrawerPrimitive.NestedRoot data-slot="drawer-nested" {...props} />;
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'fixed inset-0 z-[60] bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  size = 'full',
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  // `full` fills the sheet to the standard peek height; `fit` hugs its content
  // (capped at the same height) for short sheets like a player peek.
  size?: 'full' | 'fit';
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-sheet bg-background text-foreground shadow-float outline-none',
          size === 'fit' ? 'h-auto max-h-[calc(100%-3.5rem)]' : 'h-[calc(100%-3.5rem)]',
          className,
        )}
        {...props}
      >
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1.5 w-9 shrink-0 rounded-full bg-border-accent"
        />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex shrink-0 flex-col gap-1.5 px-4', className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex shrink-0 flex-col gap-2 px-4', className)}
      {...props}
    />
  );
}

// Centered drawer header with a "Voltar" back affordance — for nested/stacked
// sheets that return to the one beneath (player picker, stub claim, …).
function DrawerBackHeader({
  onBack,
  title,
  subtitle,
  backLabel = 'Voltar',
}: {
  onBack: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backLabel?: string;
}) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between px-3">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'flex min-w-16 items-center gap-0.5 text-brand transition-opacity active:opacity-60',
          TOUCH_TARGET_48,
        )}
      >
        <ChevronLeft className="size-[22px]" strokeWidth={2.4} aria-hidden />
        <Label className="text-brand">{backLabel}</Label>
      </button>

      <div className="min-w-0 flex-1 text-center">
        <DrawerTitle className="truncate">{title}</DrawerTitle>
        {subtitle !== undefined && (
          <Meta className="text-faint-foreground">{subtitle}</Meta>
        )}
      </div>

      <div className="w-16" />
    </div>
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('font-display text-heading', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-meta text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerNested,
  DrawerBackHeader,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
