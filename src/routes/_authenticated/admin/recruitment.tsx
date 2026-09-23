import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import {
  useAdminRecruitment,
  useAdminRecruitmentActions,
  type OpportunityStatus,
} from "@/hooks/useRecruitment";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/admin/recruitment")({
  head: () => ({
    meta: [
      { title: "Recruitment — TestFlow Admin" },
      { name: "description", content: "Manage opportunities and review tester job requests." },
      { property: "og:title", content: "Recruitment — TestFlow Admin" },
      { property: "og:description", content: "Manage opportunities and review tester job requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRecruitmentPage,
});

const OPP_ACTIONS: OpportunityStatus[] = ["OPEN", "PAUSED", "CLOSED", "CANCELLED"];
const onErr = (e: unknown) => toast.error(toSafeError(e).message);

function AdminRecruitmentPage() {
  const { data: session } = useSession();
  const isAdmin = session?.role === "ADMIN";
  const { stats, opps, requests } = useAdminRecruitment(isAdmin);
  const actions = useAdminRecruitmentActions();
  const [form, setForm] = useState({ campaignId: "", title: "", slots: 5, closesAt: "" });

  if (!isAdmin) return <EmptyState title="Admins only" description="You don't have access to this page." />;
  if (stats.isPending || opps.isPending || requests.isPending) return <LoadingState label="Loading recruitment" />;
  const err = stats.error ?? opps.error ?? requests.error;
  if (err) return <ErrorState error={err} />;
  const s = stats.data ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recruitment</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Open opportunities", s["open"]],
          ["Places requested", `${s["slotsRequested"] ?? 0}/${s["slotsTotal"] ?? 0}`],
          ["Awaiting review", (s["requested"] ?? 0) + (s["underReview"] ?? 0)],
          ["Campaigns awaiting recruitment", s["campaignsAwaitingRecruitment"]],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">New opportunity</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="Campaign ID" value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })} />
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input type="number" min={1} value={form.slots} onChange={(e) => setForm({ ...form, slots: Number(e.target.value) })} />
          <Input type="date" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} />
        </div>
        <Button
          disabled={actions.create.isPending || !form.campaignId || !form.title}
          onClick={() =>
            actions.create.mutate(form, {
              onSuccess: () => {
                toast.success("Opportunity created as draft");
                setForm({ campaignId: "", title: "", slots: 5, closesAt: "" });
              },
              onError: onErr,
            })
          }
        >
          Create draft
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Opportunities</h2>
        {opps.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opportunities yet.</p>
        ) : (
          opps.data.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div>
                <p className="font-medium">{o.title} <Badge variant="secondary">{o.status}</Badge></p>
                <p className="text-sm text-muted-foreground">
                  {o.organization_name} · {o.campaign_name} · {o.slots_requested}/{o.slots_total} requested · {o.pending_requests} pending
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {OPP_ACTIONS.filter((a) => a !== o.status).map((a) => (
                  <Button key={a} size="sm" variant="outline" onClick={() => actions.setStatus.mutate({ id: o.id, status: a }, { onError: onErr })}>
                    {a.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Job requests</h2>
        {requests.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          requests.data.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div>
                <p className="font-medium">{r.opportunity_title} <Badge variant="secondary">{r.status}</Badge></p>
                <p className="text-sm text-muted-foreground">
                  Tester {r.tester_id.slice(0, 8)} · {r.country} · {r.experience_level} · {r.verification_status}
                </p>
              </div>
              {r.status === "REQUESTED" || r.status === "UNDER_REVIEW" ? (
                <div className="flex gap-1">
                  {r.status === "REQUESTED" ? (
                    <Button size="sm" variant="outline" onClick={() => actions.review.mutate({ id: r.id, status: "UNDER_REVIEW" }, { onError: onErr })}>Review</Button>
                  ) : null}
                  <Button size="sm" onClick={() => actions.review.mutate({ id: r.id, status: "APPROVED" }, { onError: onErr })}>Approve</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => actions.review.mutate({ id: r.id, status: "REJECTED", reason: "Not selected for this job" }, { onError: onErr })}>Reject</Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
