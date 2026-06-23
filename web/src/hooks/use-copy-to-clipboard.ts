'use client';

import { useEffect, useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'failed';

// Copies text to the clipboard and exposes a transient status. `copied` auto-resets
// after `resetMs`; `failed` stays until the next attempt (so the fallback message
// doesn't vanish while the user is reading it).
export function useCopyToClipboard(resetMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (status !== 'copied') return;
    const timer = window.setTimeout(() => setStatus('idle'), resetMs);
    return () => window.clearTimeout(timer);
  }, [status, resetMs]);

  async function copy(text: string) {
    try {
      await window.navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return { copied: status === 'copied', failed: status === 'failed', copy };
}
