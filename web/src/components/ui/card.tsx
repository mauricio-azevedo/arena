import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card br-liquid-glass flex flex-col gap-4 rounded-[2rem] bg-card py-4 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 data-[size=sm]:gap-3 data-[size=sm]:rounded-[1.5rem] data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'font-heading text-base leading-snug font-semibold tracking-[-0.02em] group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  const loadingLabel = getLoadingLabel(children);

  if (loadingLabel) {
    return (
      <div
        data-slot="card-content"
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn('px-4 group-data-[size=sm]/card:px-3', className)}
        {...props}
      >
        <span className="sr-only">{loadingLabel}</span>
        <LoadingContentSkeleton />
      </div>
    );
  }

  return (
    <div
      data-slot="card-content"
      className={cn('px-4 group-data-[size=sm]/card:px-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function LoadingContentSkeleton() {
  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function getLoadingLabel(children: React.ReactNode) {
  const nodes = React.Children.toArray(children);

  if (nodes.length !== 1 || typeof nodes[0] !== 'string') {
    return null;
  }

  const text = nodes[0].trim();

  if (/^(Carregando|Verificando)\b/i.test(text)) {
    return text;
  }

  return null;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center bg-muted/35 p-4 group-data-[size=sm]/card:p-3', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
