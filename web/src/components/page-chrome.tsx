'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type PageChromeState = {
  title: string;
  showBack: boolean;
  backHref: string;
  preferBackHref: boolean;
};

type PageChromeInput = Partial<PageChromeState>;

type PageChromeContextValue = PageChromeState & {
  setPageChrome: (nextChrome: PageChromeInput) => void;
};

const PageChromeContext = createContext<PageChromeContextValue | null>(null);

type PageChromeProviderProps = {
  children: ReactNode;
  title: string;
  showBack: boolean;
  backHref: string;
  preferBackHref?: boolean;
};

export function PageChromeProvider({
  children,
  title,
  showBack,
  backHref,
  preferBackHref = false,
}: PageChromeProviderProps) {
  const [chrome, setChrome] = useState<PageChromeState>({
    title,
    showBack,
    backHref,
    preferBackHref,
  });

  const setPageChrome = useCallback((nextChrome: PageChromeInput) => {
    setChrome((currentChrome) => {
      const definedChrome = Object.fromEntries(
        Object.entries(nextChrome).filter(([, value]) => value !== undefined),
      ) as PageChromeInput;

      return {
        ...currentChrome,
        ...definedChrome,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      ...chrome,
      setPageChrome,
    }),
    [chrome, setPageChrome],
  );

  return <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>;
}

export function usePageChrome() {
  const context = useContext(PageChromeContext);

  if (!context) {
    throw new Error('usePageChrome must be used inside PageChromeProvider');
  }

  return context;
}

export function useSetPageChrome(nextChrome: PageChromeInput) {
  const { setPageChrome } = usePageChrome();
  const { title, showBack, backHref, preferBackHref } = nextChrome;

  useEffect(() => {
    setPageChrome({
      title,
      showBack,
      backHref,
      preferBackHref,
    });
  }, [backHref, preferBackHref, setPageChrome, showBack, title]);
}
