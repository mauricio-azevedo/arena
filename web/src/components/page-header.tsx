'use client';

import type { ReactNode } from 'react';
import { useSetPageChrome } from '@/components/page-chrome';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  useSetPageChrome({ title });

  if (!description && !eyebrow && !action) {
    return null;
  }

  return (
    <header className={cn('space-y-3', className)}>
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
      )}

      {(description || action) && (
        <div className="flex items-start justify-between gap-4">
          {description && (
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
          )}

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </header>
  );
}
