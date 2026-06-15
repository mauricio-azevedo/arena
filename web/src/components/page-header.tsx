import type { ReactNode } from 'react';
import { PageIntro } from '@/components/page-intro';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ description, eyebrow, action, className }: PageHeaderProps) {
  return <PageIntro eyebrow={eyebrow} description={description} action={action} className={className} />;
}
