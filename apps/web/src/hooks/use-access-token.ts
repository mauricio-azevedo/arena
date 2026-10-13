import { useSyncExternalStore } from 'react';
import { getAccessToken, subscribeAccessToken } from '@/lib/auth';

const getServerSnapshot = () => undefined;

// The stored token as render state: `undefined` while storage is unreadable (SSR,
// hydration), then the token or `null`. Re-renders on login/logout, in this tab or
// another. Hydration-safe with no setState-in-effect.
export function useAccessToken() {
  return useSyncExternalStore<string | null | undefined>(
    subscribeAccessToken,
    getAccessToken,
    getServerSnapshot,
  );
}
