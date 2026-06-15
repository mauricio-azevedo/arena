'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'arena:navigation-stack';
const MAX_STACK_SIZE = 30;

export type BackBehavior = 'auto' | 'fallback';

type SafeBackOptions = {
  behavior?: BackBehavior;
};

type NavigationContextValue = {
  stack: string[];
  previousHref: string | null;
  registerHref: (href: string) => void;
  safeBack: (fallbackHref: string, options?: SafeBackOptions) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [stack, setStack] = useState<string[]>(() => readStack());

  const previousHref = stack.length > 1 ? stack[stack.length - 2] ?? null : null;

  const registerHref = useCallback((href: string) => {
    setStack((currentStack) => {
      const nextStack = updateStack(currentStack, href);

      if (nextStack === currentStack) {
        return currentStack;
      }

      writeStack(nextStack);
      return nextStack;
    });
  }, []);

  const safeBack = useCallback(
    (fallbackHref: string, options?: SafeBackOptions) => {
      const behavior = options?.behavior ?? 'auto';
      const safeFallbackHref = getSafeInternalHref(fallbackHref, '/');

      if (behavior === 'auto' && previousHref) {
        router.back();
        return;
      }

      const nextStack = [safeFallbackHref];
      writeStack(nextStack);
      setStack(nextStack);
      router.replace(safeFallbackHref);
    },
    [previousHref, router],
  );

  const value = useMemo<NavigationContextValue>(
    () => ({
      stack,
      previousHref,
      registerHref,
      safeBack,
    }),
    [previousHref, registerHref, safeBack, stack],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useSafeNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useSafeNavigation must be used inside NavigationProvider');
  }

  return context;
}

function updateStack(stack: string[], href: string) {
  if (!isSafeInternalHref(href)) {
    return stack;
  }

  const current = stack[stack.length - 1];
  const previous = stack[stack.length - 2];

  if (current === href) {
    return stack;
  }

  if (previous === href) {
    return stack.slice(0, -1);
  }

  return [...stack, href].slice(-MAX_STACK_SIZE);
}

function readStack() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSafeInternalHref).slice(-MAX_STACK_SIZE);
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
}

function getSafeInternalHref(href: string, fallback: string) {
  return isSafeInternalHref(href) ? href : fallback;
}

function isSafeInternalHref(href: unknown): href is string {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}
