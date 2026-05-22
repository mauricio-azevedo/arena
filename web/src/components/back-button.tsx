'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDestinationLabel } from '@/lib/route-labels';

type Props = {
  href: string;
  label?: string;
  preferHref?: boolean;
};

export function BackButton({ href, label, preferHref = false }: Props) {
  const router = useRouter();
  const visibleLabel = label ?? getDestinationLabel(href);

  function handleClick() {
    if (preferHref) {
      router.push(href);
      return;
    }

    if (canSafelyGoBack()) {
      router.back();
      return;
    }

    router.push(href);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleClick} className="w-fit px-0">
      <ArrowLeft className="mr-1 h-4 w-4" />
      {visibleLabel}
    </Button>
  );
}

function canSafelyGoBack() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.history.length <= 1 || !document.referrer) {
    return false;
  }

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}
