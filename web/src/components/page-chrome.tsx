'use client';

import { useEffect } from 'react';

type PageChromeState = {
  title: string;
  showBack: boolean;
  backHref: string;
  preferBackHref: boolean;
};

type PageChromeInput = Partial<PageChromeState>;

export function useSetPageChrome(_nextChrome: PageChromeInput) {
  useEffect(() => {}, []);
}
