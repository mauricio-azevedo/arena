'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { setSessionExpiredHandler } from '@/lib/auth';
import { getSafeAuthRedirectPath } from './helpers/auth-redirect.helper';
import { AuthDrawer } from './components/auth-drawer';

// The app-wide auth bottom-sheet. One instance is mounted at the root (see
// layout.tsx); open it from anywhere a guest needs to sign in via `useAuthDrawer()`.
// There are no /login or /register pages — login and signup are views inside this
// sheet, swapped in place over whatever screen the user was on.

export type AuthDrawerView = 'login' | 'signup';
// Why the drawer was opened, when it's worth telling the user (e.g. their session
// expired). Copy lives in the login view, single-sourced.
export type AuthNotice = 'expired';
// Where to land after authenticating (defaults to the current path).
export type AuthIntent = { redirectPath?: string };

type OpenOptions = { view?: AuthDrawerView; intent?: AuthIntent; notice?: AuthNotice };

type AuthDrawerContextValue = {
  open: (opts?: OpenOptions) => void;
  close: () => void;
};

const AuthDrawerContext = createContext<AuthDrawerContextValue | null>(null);

// Client-mount gate that's hydration-safe (server snapshot false, client true)
// without a setState-in-effect — the vaul portal must not render during SSR.
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function AuthDrawerProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthDrawerView>('login');
  const [intent, setIntent] = useState<AuthIntent | null>(null);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const openDrawer = useCallback((opts?: OpenOptions) => {
    setView(opts?.view ?? 'login');
    setIntent(opts?.intent ?? null);
    setNotice(opts?.notice ?? null);
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setOpen(false), []);

  // When the API client detects a dead session, bring the user back to login over
  // wherever they are, so success returns them to the same spot. The token is
  // already cleared by triggerSessionExpired.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      const here = window.location.pathname + window.location.search;
      openDrawer({ view: 'login', intent: { redirectPath: here }, notice: 'expired' });
    });

    return () => setSessionExpiredHandler(null);
  }, [openDrawer]);

  // Hard navigation so every client `getAccessToken()` effect and all server
  // components re-run with the new token. Default destination: stay in place.
  const handleAuthenticated = useCallback(() => {
    const fallback = window.location.pathname + window.location.search;
    window.location.assign(getSafeAuthRedirectPath(intent?.redirectPath ?? fallback));
  }, [intent]);

  const value = useMemo(
    () => ({ open: openDrawer, close: closeDrawer }),
    [openDrawer, closeDrawer],
  );

  return (
    <AuthDrawerContext.Provider value={value}>
      {children}
      {isClient && (
        <AuthDrawer
          open={open}
          view={view}
          notice={notice}
          onOpenChange={setOpen}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </AuthDrawerContext.Provider>
  );
}

export function useAuthDrawer() {
  const context = useContext(AuthDrawerContext);
  if (!context) {
    throw new Error('useAuthDrawer must be used within an AuthDrawerProvider');
  }
  return context;
}
