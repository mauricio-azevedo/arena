import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      <div className="flex items-start justify-center">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>

        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>

      {description && (
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
