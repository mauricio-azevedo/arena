'use client';

import type { ReactNode } from 'react';
import { useSetPageChrome } from '@/components/page-chrome';
import { TypographyMuted, TypographySmall } from '@/components/ui/typography';
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
      {eyebrow && <TypographySmall>{eyebrow}</TypographySmall>}

      {(description || action) && (
        <div className="flex items-start justify-between gap-4">
          {description && (
            <div className="max-w-sm">
              <TypographyMuted>{description}</TypographyMuted>
            </div>
          )}

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </header>
  );
}
