'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import { getPathWithSearch, getReturnAwareHref } from '@/lib/route-labels';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  groupId: string;
  href?: string;
  returnTo?: string;
};

export function GroupLink({ groupId, href, returnTo, ...props }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const destination = href ?? `/groups/${groupId}`;
  const currentReturnTo = returnTo ?? getPathWithSearch(pathname, searchParams);

  return <Link {...props} href={getReturnAwareHref(destination, currentReturnTo)} />;
}
