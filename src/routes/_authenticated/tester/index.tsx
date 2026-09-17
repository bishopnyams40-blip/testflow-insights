import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { displayName, useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/tester/")({
  component: TesterDashboard,
});

const COUNTS = [
  { label: "Available", value: 0 },
  { label: "Requested", value: 0 },
  { label: "Pending", value: 0 },
  { label: "Assigned", value: 0 },
  { label: "Completed", value: 0 },
];

function TesterDashboard() {
  const { data: session, isPending, error, refetch } = useSession();

  if (isPending) return <LoadingState label="Loading your tester dashboard" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!session) return <Navigate to="/auth" />;
  if (session.primaryRole !== "TESTER") return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Hello, {displayName(session)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requesting a job is not an assignment — TestFlow decides final assignments.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {COUNTS.map((count) => (
          <Card key={count.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {count.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{count.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        title="No opportunities yet"
        description="Complete your profile and verification. TestFlow will surface opportunities you qualify for once matching goes live."
      />
    </div>
  );
}
