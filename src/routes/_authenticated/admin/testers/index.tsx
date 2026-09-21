import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/tester/status-badge";
import { useSession } from "@/hooks/useSession";
import {
  DEFAULT_ADMIN_FILTERS,
  useAdminTesterStats,
  useAdminTesters,
  type AdminTesterFilters,
} from "@/hooks/useTesterNetwork";
import { AVAILABILITY_OPTIONS, DEVICE_PLATFORMS, EXPERIENCE_LEVELS } from "@/lib/tester";

export const Route = createFileRoute("/_authenticated/admin/testers/")({
  head: () => ({
    meta: [
      { title: "Tester network — TestFlow admin" },
      {
        name: "description",
        content: "Search, filter and manage every tester in the TestFlow network.",
      },
      { property: "og:title", content: "Tester network — TestFlow admin" },
      {
        property: "og:description",
        content: "Search, filter and manage every tester in the TestFlow network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTestersPage,
});

function AdminTestersPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const isAdmin = session?.primaryRole === "ADMIN";
  const [filters, setFilters] = useState<AdminTesterFilters>(DEFAULT_ADMIN_FILTERS);
  const [searchDraft, setSearchDraft] = useState("");
  const stats = useAdminTesterStats(Boolean(isAdmin));
  const { data, isPending, error, refetch } = useAdminTesters(filters, Boolean(isAdmin));

  if (sessionPending) return <LoadingState label="Loading tester network" />;
  if (!session) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const update = (patch: Partial<AdminTesterFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tester network</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every tester registered with TestFlow. Clients never see this data.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total testers", value: stats.data?.total ?? 0 },
          { label: "Active", value: stats.data?.active ?? 0 },
          { label: "Pending verification", value: stats.data?.pending_verification ?? 0 },
          { label: "Suspended", value: stats.data?.suspended ?? 0 },
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
          <label className="text-xs font-medium text-muted-foreground" htmlFor="search">
            Search name or email
          </label>
          <div className="mt-1 flex gap-2">
            <Input
              id="search"
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
        <Filter
          label="Account status"
          value={filters.accountStatus ?? ""}
          options={["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"]}
          onChange={(v) =>
            update({ accountStatus: (v || null) as AdminTesterFilters["accountStatus"] })
          }
        />
        <Filter
          label="Availability"
          value={filters.availability ?? ""}
          options={AVAILABILITY_OPTIONS.map((o) => o.value)}
          onChange={(v) =>
            update({ availability: (v || null) as AdminTesterFilters["availability"] })
          }
        />
        <Filter
          label="Verification"
          value={filters.verification ?? ""}
          options={["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"]}
          onChange={(v) =>
            update({ verification: (v || null) as AdminTesterFilters["verification"] })
          }
        />
        <Filter
          label="Experience"
          value={filters.experience ?? ""}
          options={EXPERIENCE_LEVELS.map((o) => o.value)}
          onChange={(v) => update({ experience: (v || null) as AdminTesterFilters["experience"] })}
        />
        <Filter
          label="Device platform"
          value={filters.platform ?? ""}
          options={DEVICE_PLATFORMS.map((o) => o.value)}
          onChange={(v) => update({ platform: (v || null) as AdminTesterFilters["platform"] })}
        />
        <div className="min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="country">
            Country
          </label>
          <Input
            id="country"
            className="mt-1"
            value={filters.country}
            onChange={(e) => update({ country: e.target.value })}
          />
        </div>
      </div>

      {isPending ? (
        <LoadingState label="Loading testers" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (data?.rows.length ?? 0) === 0 ? (
        <EmptyState
          title="No testers match"
          description="Adjust the filters, or wait for new testers to register."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tester</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Devices</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data!.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {[row.city, row.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">{row.experience_level}</td>
                  <td className="px-4 py-3">{Number(row.device_count)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge value={row.account_status} />
                      <StatusBadge value={row.verification_status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/testers/$testerId"
                      params={{ testerId: row.id }}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} tester{total === 1 ? "" : "s"} · page {filters.page} of {pages}
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
    </div>
  );
}

function Filter(props: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-[150px]">
      <label className="text-xs font-medium text-muted-foreground">{props.label}</label>
      <select
        className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        <option value="">Any</option>
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
