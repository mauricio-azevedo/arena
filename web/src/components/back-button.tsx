'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  fallbackHref: string;
  label?: string;
};

export function BackButton({ fallbackHref, label = 'Voltar' }: Props) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleClick} className="w-fit px-0">
      <ArrowLeft className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
