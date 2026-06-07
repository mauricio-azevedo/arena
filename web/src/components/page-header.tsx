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
    <header className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/75">
              {eyebrow}
            </p>
          )}

          <h1 className="text-balance text-[2.45rem] font-semibold leading-[0.96] tracking-[-0.065em] text-foreground">
            {title}
          </h1>
        </div>

        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>

      {description && (
        <p className="max-w-sm text-[0.95rem] leading-6 text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
