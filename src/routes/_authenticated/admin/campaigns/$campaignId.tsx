import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { NativeSelect } from "@/components/campaign/campaign-form";
import { useSession } from "@/hooks/useSession";
import { useAdminSetCampaignStatus, useCampaign } from "@/hooks/useCampaigns";
import {
  adminTransitionsFor,
  formatRequirementValue,
  OPERATOR_LABELS,
  PRODUCT_TYPE_LABELS,
  SERVICE_LABELS,
  STATUS_LABELS,
  type CampaignStatus,
} from "@/lib/campaign";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/admin/campaigns/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign review — TestFlow admin" },
      { name: "description", content: "Full campaign brief, tasks and requirements for operations." },
      { property: "og:title", content: "Campaign review — TestFlow admin" },
      {
        property: "og:description",
        content: "Full campaign brief, tasks and requirements for operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCampaignDetailPage,
});

function AdminCampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const { data: session, isPending: sessionPending } = useSession();
  const isAdmin = session?.primaryRole === "ADMIN";
  const { data, isPending, error, refetch } = useCampaign(campaignId);
  const setStatus = useAdminSetCampaignStatus(campaignId);
  const [nextStatus, setNextStatus] = useState("");
  const [reason, setReason] = useState("");

  if (sessionPending || isPending) return <LoadingState label="Loading campaign" />;
  if (!session) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data)
    return (
      <EmptyState
        title="Campaign not found"
        description="This campaign no longer exists."
        action={
          <Button asChild variant="outline">
            <Link to="/admin/campaigns">Back to campaigns</Link>
          </Button>
        }
      />
    );

  const { campaign, tasks, requirements, completeness } = data;
  const transitions = adminTransitionsFor(campaign.status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/campaigns" className="text-sm text-muted-foreground hover:underline">
            ← All campaigns
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{campaign.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SERVICE_LABELS[campaign.service_type]} ·{" "}
            {campaign.product_type ? PRODUCT_TYPE_LABELS[campaign.product_type] : "Product type not set"}
          </p>
        </div>
        <Badge variant="secondary">{STATUS_LABELS[campaign.status]}</Badge>
      </header>

      <section className="grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2">
        <Detail label="Product" value={campaign.product_name ?? "—"} />
        <Detail label="Link" value={campaign.product_url ?? "—"} />
        <Detail label="Participants" value={String(campaign.participant_target)} />
        <Detail
          label="Deadline"
          value={campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : "—"}
        />
        <Detail label="Objective" value={campaign.objective ?? "—"} />
        <Detail
          label="Brief complete"
          value={completeness.complete ? "Yes" : `No — missing ${completeness.missing.join(", ")}`}
        />
        <Detail
          label="Submitted"
          value={campaign.submitted_at ? new Date(campaign.submitted_at).toLocaleString() : "—"}
        />
        <Detail label="Client notes" value={campaign.client_notes ?? "—"} />
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks defined.</p>
        ) : (
          <ol className="space-y-2">
            {tasks.map((task, index) => (
              <li key={task.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {index + 1}. {task.title}
                </p>
                {task.instructions ? (
                  <p className="mt-1 whitespace-pre-line text-muted-foreground">{task.instructions}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tester requirements
        </h2>
        {requirements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requirements specified.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {requirements.map((req) => (
              <li key={req.id} className="rounded-lg border p-3">
                {String(req.requirement_type).replaceAll("_", " ").toLowerCase()}{" "}
                {OPERATOR_LABELS[req.operator]} {formatRequirementValue(req.value)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Change status
        </h2>
        {transitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No status changes are available from {STATUS_LABELS[campaign.status]}.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56">
              <Label htmlFor="next-status">New status</Label>
              <div className="mt-1">
                <NativeSelect
                  id="next-status"
                  value={nextStatus}
                  placeholder="Choose…"
                  onChange={setNextStatus}
                  options={transitions.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                />
              </div>
            </div>
            <div className="w-64">
              <Label htmlFor="status-reason">Reason (optional)</Label>
              <Input
                id="status-reason"
                className="mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button
              disabled={!nextStatus || setStatus.isPending}
              onClick={() =>
                setStatus.mutate(
                  {
                    status: nextStatus as CampaignStatus,
                    ...(reason.trim() ? { reason: reason.trim() } : {}),
                  },
                  {
                    onSuccess: () => {
                      toast.success("Status updated");
                      setNextStatus("");
                      setReason("");
                    },
                    onError: (err) => toast.error(toSafeError(err).message),
                  },
                )
              }
            >
              Apply
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}
