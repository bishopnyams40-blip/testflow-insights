import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { useTesterRequests, useWithdrawRequest } from "@/hooks/useRecruitment";
import { SERVICE_LABELS } from "@/lib/campaign";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/tester/requested")({
  head: () => ({
    meta: [
      { title: "Requested — TestFlow" },
      { name: "description", content: "Jobs you have asked to join, awaiting a decision from TestFlow." },
      { property: "og:title", content: "Requested — TestFlow" },
      { property: "og:description", content: "Jobs you have asked to join, awaiting a decision from TestFlow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterRequestedPage,
});

function TesterRequestedPage() {
  const { data, isPending, error, refetch } = useTesterRequests();
  const withdraw = useWithdrawRequest();
  if (isPending) return <LoadingState label="Loading requests" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Requested</h1>
      {data.length === 0 ? (
        <EmptyState title="No requests yet" description="Jobs you ask to join will appear here." />
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {SERVICE_LABELS[r.service_type]} · requested {new Date(r.requested_at).toLocaleDateString()}
                </p>
                {r.rejection_reason ? <p className="mt-1 text-sm text-destructive">{r.rejection_reason}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{r.status.replaceAll("_", " ").toLowerCase()}</Badge>
                {r.status === "REQUESTED" || r.status === "UNDER_REVIEW" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      withdraw.mutate(r.id, {
                        onSuccess: () => toast.success("Request withdrawn"),
                        onError: (e) => toast.error(toSafeError(e).message),
                      })
                    }
                  >
                    Withdraw
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
