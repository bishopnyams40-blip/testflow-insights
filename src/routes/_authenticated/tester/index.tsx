import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/tester/status-badge";
import { displayName, useSession } from "@/hooks/useSession";
import { useTesterWorkspace } from "@/hooks/useTesterNetwork";

export const Route = createFileRoute("/_authenticated/tester/")({
  component: TesterDashboard,
});

function TesterDashboard() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data, isPending, error, refetch, completeness } = useTesterWorkspace();

  if (sessionPending || isPending) return <LoadingState label="Loading your tester dashboard" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!session) return <Navigate to="/auth" />;
  if (session.primaryRole !== "TESTER") return <Navigate to="/dashboard" />;

  const profile = data?.profile ?? null;
  const verifiedDevices = (data?.devices ?? []).filter(
    (d) => d.verification_status === "VERIFIED",
  ).length;
  const verifiedItems = (data?.verifications ?? []).filter((v) => v.status === "VERIFIED").length;

  const counts = [
    { label: "Devices", value: data?.devices.length ?? 0 },
    { label: "Verified devices", value: verifiedDevices },
    { label: "Skills", value: data?.skills.length ?? 0 },
    { label: "Verified checks", value: verifiedItems },
    { label: "Completed jobs", value: profile?.completed_jobs_count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {displayName(session)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep your profile current — TestFlow decides assignments from it.
          </p>
        </div>
        {profile ? (
          <div className="flex gap-2">
            <StatusBadge value={profile.account_status} />
            <StatusBadge value={profile.availability_status} />
          </div>
        ) : null}
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile completeness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={completeness.percent} className="h-2" />
            <span className="text-sm font-semibold">{completeness.percent}%</span>
          </div>
          {completeness.missing.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Still to add: {completeness.missing.join(", ")}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Your profile is complete.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link to="/tester/profile">Edit profile</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/tester/devices">Manage devices</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/tester/verification">Verification</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((count) => (
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

      <p className="text-sm text-muted-foreground">
        Quality and reliability scores appear here once TestFlow has enough completed work to
        calculate them.
      </p>
    </div>
  );
}
