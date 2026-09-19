import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/tester/status-badge";
import { useRequestVerification, useTesterWorkspace } from "@/hooks/useTesterNetwork";
import { VERIFICATION_TYPES } from "@/lib/tester";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/tester/verification")({
  head: () => ({
    meta: [
      { title: "Verification — TestFlow" },
      {
        name: "description",
        content: "Track which parts of your tester account TestFlow has verified.",
      },
      { property: "og:title", content: "Verification — TestFlow" },
      {
        property: "og:description",
        content: "Track which parts of your tester account TestFlow has verified.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterVerificationPage,
});

function TesterVerificationPage() {
  const { data, isPending, error, refetch } = useTesterWorkspace();
  const request = useRequestVerification(data?.profile?.id);

  if (isPending) return <LoadingState label="Loading verification" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const byType = new Map((data?.verifications ?? []).map((v) => [v.verification_type, v]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only TestFlow staff can approve a verification. You can ask for a review at any time.
          </p>
        </div>
        {data?.profile ? <StatusBadge value={data.profile.verification_status} /> : null}
      </header>

      <ul className="divide-y rounded-lg border bg-card">
        {VERIFICATION_TYPES.map((type) => {
          const record = byType.get(type.value);
          const status = record?.status ?? "NOT_STARTED";
          return (
            <li
              key={type.value}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.hint}</p>
                {record?.rejection_reason ? (
                  <p className="mt-1 text-xs text-destructive">{record.rejection_reason}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge value={status} />
                {status === "NOT_STARTED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={request.isPending}
                    onClick={() =>
                      request.mutate(type.value, {
                        onSuccess: () => toast.success("Review requested"),
                        onError: (err) => toast.error(toSafeError(err).message),
                      })
                    }
                  >
                    Request review
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
