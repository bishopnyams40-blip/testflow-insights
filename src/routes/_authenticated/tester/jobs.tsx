import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { useRequestJob, useTesterOpportunities } from "@/hooks/useRecruitment";
import { SERVICE_LABELS } from "@/lib/campaign";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/tester/jobs")({
  head: () => ({
    meta: [
      { title: "Available Jobs — TestFlow" },
      {
        name: "description",
        content: "Opportunities you qualify for. Requesting a job is not an assignment.",
      },
      { property: "og:title", content: "Available Jobs — TestFlow" },
      {
        property: "og:description",
        content: "Opportunities you qualify for. Requesting a job is not an assignment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterJobsPage,
});

function TesterJobsPage() {
  const { data, isPending, error, refetch } = useTesterOpportunities();
  const request = useRequestJob();
  if (isPending) return <LoadingState label="Loading jobs" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Available Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs you qualify for. Requesting a job is not an assignment — TestFlow reviews every
          request.
        </p>
      </header>
      {data.length === 0 ? (
        <EmptyState
          title="No jobs right now"
          description="Keep your profile and devices up to date to qualify for more."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5"
            >
              <div>
                <p className="font-medium">{o.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {SERVICE_LABELS[o.service_type]} · {o.slots_total - o.slots_requested} places left
                  {o.closes_at ? ` · closes ${new Date(o.closes_at).toLocaleDateString()}` : ""}
                </p>
                {o.description ? <p className="mt-2 text-sm">{o.description}</p> : null}
              </div>
              {o.request_status ? (
                <Badge variant="secondary">
                  {o.request_status.replaceAll("_", " ").toLowerCase()}
                </Badge>
              ) : (
                <Button
                  disabled={request.isPending}
                  onClick={() =>
                    request.mutate(o.id, {
                      onSuccess: () => toast.success("Request sent to TestFlow"),
                      onError: (e) => toast.error(toSafeError(e).message),
                    })
                  }
                >
                  Request to join
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
