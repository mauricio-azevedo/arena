'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Transient success confirmation: a floating pill that pops in above the bottom
// nav and auto-dismisses. One at a time (latest wins), per the design. Mounted
// once at the app root (see layout.tsx); fire it anywhere via `useToast()`.

const VISIBLE_MS = 2000; // hold time before the pill animates out
const EXIT_MS = 150; // must match the leave animation duration on the pill

type ToastState = { id: number; message: string; closing: boolean };

type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

// Client-mount gate that's hydration-safe (server snapshot false, client true)
// without a setState-in-effect — the portal must not render during SSR.
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    if (removeTimer.current) clearTimeout(removeTimer.current);
  }, []);

  const showToast = useCallback(
    (message: string) => {
      clearTimers();
      idRef.current += 1;
      setToast({ id: idRef.current, message, closing: false });

      exitTimer.current = setTimeout(() => {
        setToast((current) => (current ? { ...current, closing: true } : null));
        removeTimer.current = setTimeout(() => setToast(null), EXIT_MS);
      }, VISIBLE_MS);
    },
    [clearTimers],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastViewport({ toast }: { toast: ToastState | null }) {
  // Portals to <body>, so there's nothing to render server-side; the toast is
  // always null until a user action, long after hydration.
  if (!useIsClient()) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[70] flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={cn(
            'inline-flex h-11 items-center gap-snug rounded-pill bg-background/90 px-comfortable text-label text-foreground shadow-toast backdrop-blur-md',
            toast.closing
              ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-1 motion-safe:duration-150'
              : 'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:slide-in-from-top-2 motion-safe:duration-200',
          )}
        >
          <Check className="size-[1.0625rem] shrink-0 text-success" strokeWidth={2.8} aria-hidden />
          {toast.message}
        </div>
      )}
    </div>,
    document.body,
  );
}
