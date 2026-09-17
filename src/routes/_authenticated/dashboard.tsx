import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { displayName, useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: ClientDashboard,
});

const METRICS = [
  { label: "Active campaigns", value: 0 },
  { label: "Testers assigned", value: 0 },
  { label: "Reports ready", value: 0 },
  { label: "Open messages", value: 0 },
];

function ClientDashboard() {
  const { data: session, isPending, error, refetch } = useSession();

  if (isPending) return <LoadingState label="Loading your dashboard" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!session) return <Navigate to="/auth" />;
  if (session.primaryRole === "TESTER") return <Navigate to="/tester" />;
  if (session.primaryRole === "ADMIN") return <Navigate to="/admin" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Welcome back, {displayName(session)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.memberships[0]?.organizationName ?? "Your organisation"} · role{" "}
          {session.memberships[0]?.role ?? "MEMBER"}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        title="No campaigns yet"
        description="Campaign creation arrives in the next release. Your organisation, access rules and campaign records are already in place."
      />
    </div>
  );
}
