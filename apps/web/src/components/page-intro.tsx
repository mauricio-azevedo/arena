import type { ReactNode } from 'react';
import { TypographyH1, TypographyMuted, TypographySmall } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type PageIntroProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageIntro({ eyebrow, title, description, action, className }: PageIntroProps) {
  if (!eyebrow && !title && !description && !action) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {(eyebrow || title) && (
        <div className="space-y-1">
          {eyebrow && <TypographySmall>{eyebrow}</TypographySmall>}
          {title && <TypographyH1 className="text-3xl tracking-[-0.06em]">{title}</TypographyH1>}
        </div>
      )}

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
    </div>
  );
}
