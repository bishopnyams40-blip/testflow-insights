import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { NativeSelect } from "@/components/campaign/campaign-form";
import { useSession } from "@/hooks/useSession";
import {
  DEFAULT_CAMPAIGN_FILTERS,
  useCampaigns,
  type CampaignListFilters,
} from "@/hooks/useCampaigns";
import {
  CAMPAIGN_STATUSES,
  SERVICE_LABELS,
  SERVICE_TYPES,
  STATUS_LABELS,
  type CampaignStatus,
  type ServiceType,
} from "@/lib/campaign";

export const Route = createFileRoute("/_authenticated/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaigns — TestFlow" },
      {
        name: "description",
        content: "Every testing campaign your team has requested, run end to end by TestFlow.",
      },
      { property: "og:title", content: "Campaigns — TestFlow" },
      {
        property: "og:description",
        content: "Every testing campaign your team has requested, run end to end by TestFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [filters, setFilters] = useState<CampaignListFilters>(DEFAULT_CAMPAIGN_FILTERS);
  const [searchDraft, setSearchDraft] = useState("");
  const organizationId = session?.activeOrganizationId ?? null;
  const { data, isPending, error, refetch } = useCampaigns(organizationId, filters);

  if (sessionPending) return <LoadingState label="Loading campaigns" />;
  if (!session) return <Navigate to="/auth" />;

  const update = (patch: Partial<CampaignListFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft a request, send it to the TestFlow team, and follow its progress here.
          </p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new">New campaign</Link>
        </Button>
      </header>

      {!organizationId ? (
        <EmptyState
          title="No organisation yet"
          description="Your account isn't linked to an organisation, so campaigns can't be created yet."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
            <div className="min-w-[220px] flex-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="campaign-search"
              >
                Search by name
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="campaign-search"
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
            <EmptyState
              title="No campaigns yet"
              description="Create your first campaign request and the TestFlow team will take it from there."
              action={
                <Button asChild>
                  <Link to="/campaigns/new">New campaign</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y rounded-xl border bg-card">
              {data!.rows.map((campaign) => (
                <Link
                  key={campaign.id}
                  to="/campaigns/$campaignId"
                  params={{ campaignId: campaign.id }}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {SERVICE_LABELS[campaign.service_type]} · {campaign.participant_target}{" "}
                      participants
                      {campaign.deadline
                        ? ` · due ${new Date(campaign.deadline).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">{STATUS_LABELS[campaign.status]}</Badge>
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
        </>
      )}
    </div>
  );
}
