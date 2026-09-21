import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { NativeSelect } from "@/components/campaign/campaign-form";
import { useSession } from "@/hooks/useSession";
import {
  DEFAULT_ADMIN_CAMPAIGN_FILTERS,
  useAdminCampaignStats,
  useAdminCampaigns,
  type AdminCampaignFilters,
} from "@/hooks/useCampaigns";
import {
  CAMPAIGN_STATUSES,
  SERVICE_LABELS,
  SERVICE_TYPES,
  STATUS_LABELS,
  type CampaignStatus,
  type ServiceType,
} from "@/lib/campaign";

export const Route = createFileRoute("/_authenticated/admin/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaign operations — TestFlow admin" },
      {
        name: "description",
        content: "Review, search and progress every client campaign across TestFlow.",
      },
      { property: "og:title", content: "Campaign operations — TestFlow admin" },
      {
        property: "og:description",
        content: "Review, search and progress every client campaign across TestFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCampaignsPage,
});

function AdminCampaignsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const isAdmin = session?.primaryRole === "ADMIN";
  const [filters, setFilters] = useState<AdminCampaignFilters>(DEFAULT_ADMIN_CAMPAIGN_FILTERS);
  const [searchDraft, setSearchDraft] = useState("");
  const stats = useAdminCampaignStats(Boolean(isAdmin));
  const { data, isPending, error, refetch } = useAdminCampaigns(filters, Boolean(isAdmin));

  if (sessionPending) return <LoadingState label="Loading campaigns" />;
  if (!session) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const update = (patch: Partial<AdminCampaignFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Campaign operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every campaign across all client organisations.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: stats.data?.total ?? 0 },
          { label: "Drafts", value: stats.data?.drafts ?? 0 },
          { label: "Submitted", value: stats.data?.submitted ?? 0 },
          { label: "Cancelled", value: stats.data?.cancelled ?? 0 },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{Number(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="min-w-[220px] flex-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="admin-campaign-search"
          >
            Search campaign or organisation
          </label>
          <div className="mt-1 flex gap-2">
            <Input
              id="admin-campaign-search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") update({ search: searchDraft });
              }}
            />
            <Button variant="outline" onClick={() => update({ search: searchDraft })}>
              Search
            </Button>
          </div>
        </div>
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <div className="mt-1">
            <NativeSelect
              value={filters.status ?? ""}
              placeholder="Any status"
              onChange={(v) => update({ status: (v || null) as CampaignStatus | null })}
              options={CAMPAIGN_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground">Service</label>
          <div className="mt-1">
            <NativeSelect
              value={filters.service ?? ""}
              placeholder="Any service"
              onChange={(v) => update({ service: (v || null) as ServiceType | null })}
              options={SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] }))}
            />
          </div>
        </div>
      </div>

      {isPending ? (
        <LoadingState label="Loading campaigns" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (data?.rows.length ?? 0) === 0 ? (
        <EmptyState title="No campaigns found" description="Try a different search or filter." />
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {data!.rows.map((row) => (
            <Link
              key={row.id}
              to="/admin/campaigns/$campaignId"
              params={{ campaignId: row.id }}
              className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">
                  {row.organization_name} · {SERVICE_LABELS[row.service_type as ServiceType]} ·{" "}
                  {row.participant_target} participants
                </p>
              </div>
              <Badge variant="secondary">{STATUS_LABELS[row.status as CampaignStatus]}</Badge>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {filters.page} of {pages} · {total} campaigns
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= pages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
