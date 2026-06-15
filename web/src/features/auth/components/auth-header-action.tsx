'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildAuthHref } from '@/features/auth/helpers/auth-redirect.helper';
import { getAccessToken } from '@/lib/auth';

type AuthHeaderActionProps = {
  redirectPath: string;
};

export function AuthHeaderAction({ redirectPath }: AuthHeaderActionProps) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(Boolean(getAccessToken()));
  }, []);

  if (hasToken !== false) {
    return null;
  }

  return (
    <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
      <Link href={buildAuthHref('/login', redirectPath)} aria-label="Entrar na sua conta">
        Entrar
      </Link>
    </Button>
  );
}
