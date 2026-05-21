import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              {eyebrow}
            </p>
          )}

          <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground">
            {title}
          </h1>
        </div>

        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>

      {description && (
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
