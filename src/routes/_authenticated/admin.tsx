import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminOverview,
});

const CONTROL_AREAS = [
  "Clients",
  "Testers",
  "Campaigns",
  "Recruitment",
  "Matching & assignment",
  "Quality control",
  "Replacements",
  "Payments & rewards",
  "Pricing",
  "Reports & AI analysis",
  "Messages",
  "Audit logs",
];

function AdminOverview() {
  const { data: session, isPending, error, refetch } = useSession();

  if (isPending) return <LoadingState label="Loading operations" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!session) return <Navigate to="/auth" />;
  if (session.primaryRole !== "ADMIN") return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          TestFlow admins control recruitment, assignment, quality and payouts.
        </p>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CONTROL_AREAS.map((area) => (
          <li key={area} className="rounded-lg border bg-card px-4 py-3 text-sm">
            {area}
          </li>
        ))}
      </ul>

      <EmptyState
        title="Admin tools arrive next"
        description="Admin-only access rules, the audit log and the financial ledger are already enforced in the database."
      />
    </div>
  );
}
