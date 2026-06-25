'use client';

import { useState, type ReactNode } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Meta, Overline } from '@/components/ui/text';

// A single field cell for the sheet/drawer form style: an Overline label over a
// bare bold input, with a built-in error state (red label, a red field tint, an
// inline alert icon, and a message row). Stack cells inside a `rounded-card
// bg-surface shadow-hairline` group separated by `h-px bg-border` dividers, or sit
// two side by side (with a `w-px bg-border` divider) for a split row.
type SheetFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  // When set, the cell turns into its error state and shows this message.
  error?: string;
  // Rendered at the end of the input row, after the error icon (e.g. a toggle).
  trailing?: ReactNode;
  className?: string;
};

export function SheetField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
  error,
  trailing,
  className,
}: SheetFieldProps) {
  const hasError = Boolean(error);

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col px-4 py-3 transition-colors',
        hasError && 'bg-danger/10',
        className,
      )}
    >
      <Overline asChild className={hasError ? 'text-danger' : 'text-faint-foreground'}>
        <label htmlFor={id}>{label}</label>
      </Overline>

      <div className="mt-1 flex items-center gap-2">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-input font-bold text-foreground outline-none placeholder:font-medium placeholder:text-faint-foreground disabled:opacity-50"
        />
        {hasError && (
          <CircleAlert
            className="size-[1.0625rem] shrink-0 text-danger"
            strokeWidth={2.4}
            aria-hidden
          />
        )}
        {trailing}
      </div>

      {hasError && (
        <div className="mt-snug flex items-center gap-1.5 text-danger">
          <CircleAlert className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden />
          <Meta className="font-bold text-danger">{error}</Meta>
        </div>
      )}
    </div>
  );
}

// Password variant: the same cell plus a built-in show/hide toggle. Owns its own
// visibility state so callers only pass value/onChange/error.
export function SheetPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  error,
}: Omit<SheetFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);

  return (
    <SheetField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      type={visible ? 'text' : 'password'}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      error={error}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint-foreground transition-transform active:scale-90 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="size-[1.125rem]" strokeWidth={2.2} aria-hidden />
          ) : (
            <Eye className="size-[1.125rem]" strokeWidth={2.2} aria-hidden />
          )}
        </button>
      }
    />
  );
}
