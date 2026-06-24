// Destination-shaped skeleton for the profile: identity, performance card, and the
// groups rail — same rhythm as the loaded screen so the swap is calm.
export function ProfileLoadingState() {
  return (
    <div className="space-y-section" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando perfil</span>

      <div className="flex items-center gap-comfortable">
        <div className="size-[3.625rem] animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-muted/80" />
        </div>
      </div>

      <div className="h-44 animate-pulse rounded-card bg-muted/80" />
      <div className="h-24 animate-pulse rounded-card bg-muted/80" />

      <div className="flex gap-base overflow-hidden pt-snug">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-36 w-[9.875rem] shrink-0 animate-pulse rounded-card bg-muted/80"
          />
        ))}
      </div>
    </div>
  );
}
