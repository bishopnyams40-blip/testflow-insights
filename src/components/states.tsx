import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toSafeError } from "@/lib/errors";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label={label}>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const safe = toSafeError(error);
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <p className="text-sm font-semibold text-destructive">{safe.code}</p>
      <p className="mt-1 text-sm text-muted-foreground">{safe.message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
