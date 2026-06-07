import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'br-hairline h-12 w-full min-w-0 rounded-[1.35rem] bg-white/48 px-4 py-2 text-base shadow-[inset_0_1px_0_color-mix(in_oklch,white_62%,transparent),0_10px_28px_color-mix(in_oklch,var(--primary)_8%,transparent)] backdrop-blur-xl transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-white/72 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-white/10 dark:focus-visible:bg-white/14',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
