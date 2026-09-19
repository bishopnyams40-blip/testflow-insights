import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/tester/status-badge";
import { useSession } from "@/hooks/useSession";
import { useAdminTesterActions, useAdminTesterDetail } from "@/hooks/useTesterNetwork";
import { AVAILABILITY_OPTIONS, VERIFICATION_TYPES, titleCase } from "@/lib/tester";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/admin/testers/$testerId")({
  head: () => ({
    meta: [
      { title: "Tester detail — TestFlow admin" },
      { name: "description", content: "Review and manage a single TestFlow tester." },
      { property: "og:title", content: "Tester detail — TestFlow admin" },
      { property: "og:description", content: "Review and manage a single TestFlow tester." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTesterDetailPage,
});

function AdminTesterDetailPage() {
  const { testerId } = Route.useParams();
  const { data: session, isPending: sessionPending } = useSession();
  const isAdmin = session?.primaryRole === "ADMIN";
  const { data, isPending, error, refetch } = useAdminTesterDetail(testerId, Boolean(isAdmin));
  const actions = useAdminTesterActions(testerId);
  const [reason, setReason] = useState("");

  if (sessionPending || isPending) return <LoadingState label="Loading tester" />;
  if (!session) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data) return <ErrorState error={new Error("NOT_FOUND")} />;

  const { profile, account, devices, skills, verifications } = data;
  const fail = (err: unknown) => toast.error(toSafeError(err).message);

  return (
    <div className="space-y-6">
      <Link to="/admin/testers" className="text-sm underline underline-offset-4">
        ← Back to tester network
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {[account?.first_name, account?.last_name].filter(Boolean).join(" ") ||
              account?.email ||
              "Tester"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {account?.email} · {[profile.city, profile.country].filter(Boolean).join(", ") || "—"} ·{" "}
            {profile.timezone ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={profile.account_status} />
          <StatusBadge value={profile.availability_status} />
          <StatusBadge value={profile.verification_status} />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completed jobs", value: profile.completed_jobs_count },
          { label: "Rejected jobs", value: profile.rejected_jobs_count },
          { label: "Expired jobs", value: profile.expired_jobs_count },
          {
            label: "Scores calculated",
            value: profile.scores_calculated_at ? "Yes" : "Not yet",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{String(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Reason (optional)</p>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ACTIVE", "PENDING", "SUSPENDED", "DEACTIVATED"] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={profile.account_status === status ? "default" : "outline"}
                disabled={actions.setStatus.isPending}
                onClick={() =>
                  actions.setStatus.mutate(
                    { status, reason: reason || undefined },
                    { onSuccess: () => toast.success("Status updated"), onError: fail },
                  )
                }
              >
                {titleCase(status)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={profile.availability_status === option.value ? "default" : "outline"}
                disabled={actions.setAvailability.isPending}
                onClick={() =>
                  actions.setAvailability.mutate(option.value, {
                    onSuccess: () => toast.success("Availability updated"),
                    onError: fail,
                  })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No devices registered.</p>
          ) : (
            <ul className="divide-y">
              {devices.map((device) => (
                <li
                  key={device.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {[device.manufacturer, device.model].filter(Boolean).join(" ") ||
                        titleCase(device.device_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {titleCase(device.platform)} · {device.operating_system ?? "—"}{" "}
                      {device.os_version ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={device.verification_status} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        actions.reviewDevice.mutate(
                          { deviceId: device.id, status: "VERIFIED" },
                          { onSuccess: () => toast.success("Device verified"), onError: fail },
                        )
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        actions.reviewDevice.mutate(
                          {
                            deviceId: device.id,
                            status: "REJECTED",
                            reason: reason || undefined,
                          },
                          { onSuccess: () => toast.success("Device rejected"), onError: fail },
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills added.</p>
          ) : (
            <ul className="divide-y">
              {skills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{skill.skill}</p>
                    <p className="text-xs text-muted-foreground">
                      {titleCase(skill.experience_level)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={skill.verification_status} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        actions.reviewSkill.mutate(
                          { skillId: skill.id, status: "VERIFIED" },
                          { onSuccess: () => toast.success("Skill verified"), onError: fail },
                        )
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        actions.reviewSkill.mutate(
                          { skillId: skill.id, status: "REJECTED" },
                          { onSuccess: () => toast.success("Skill rejected"), onError: fail },
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {VERIFICATION_TYPES.map((type) => {
              const record = verifications.find((v) => v.verification_type === type.value);
              return (
                <li
                  key={type.value}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <p className="text-sm font-medium">{type.label}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={record?.status ?? "NOT_STARTED"} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        actions.reviewVerification.mutate(
                          { type: type.value, status: "VERIFIED" },
                          { onSuccess: () => toast.success("Verified"), onError: fail },
                        )
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        actions.reviewVerification.mutate(
                          {
                            type: type.value,
                            status: "REJECTED",
                            reason: reason || undefined,
                          },
                          { onSuccess: () => toast.success("Rejected"), onError: fail },
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
