import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/tester/status-badge";
import { useAddDevice, useDeleteDevice, useTesterWorkspace } from "@/hooks/useTesterNetwork";
import {
  DEVICE_PLATFORMS,
  DEVICE_TYPES,
  testerDeviceSchema,
  titleCase,
  type TesterDeviceInput,
} from "@/lib/tester";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/tester/devices")({
  head: () => ({
    meta: [
      { title: "My devices — TestFlow" },
      {
        name: "description",
        content: "Add the phones, tablets and computers you can test on.",
      },
      { property: "og:title", content: "My devices — TestFlow" },
      {
        property: "og:description",
        content: "Add the phones, tablets and computers you can test on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterDevicesPage,
});

const EMPTY: TesterDeviceInput = {
  platform: "IPHONE",
  deviceType: "PHONE",
  manufacturer: "",
  model: "",
  operatingSystem: "",
  osVersion: "",
  browser: "",
  browserVersion: "",
};

function TesterDevicesPage() {
  const { data, isPending, error, refetch } = useTesterWorkspace();
  const addDevice = useAddDevice(data?.profile?.id);
  const removeDevice = useDeleteDevice();
  const [form, setForm] = useState<TesterDeviceInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (isPending) return <LoadingState label="Loading your devices" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = testerDeviceSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    addDevice.mutate(parsed.data, {
      onSuccess: () => {
        toast.success("Device added — TestFlow will review it");
        setForm(EMPTY);
      },
      onError: (err) => toast.error(toSafeError(err).message),
    });
  };

  const devices = data?.devices ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">My devices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devices are reviewed by TestFlow before they count towards matching.
        </p>
      </header>

      {devices.length === 0 ? (
        <EmptyState
          title="No devices yet"
          description="Add at least one device so TestFlow knows what you can test on."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {devices.map((device) => (
            <li key={device.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {device.manufacturer ? `${device.manufacturer} ` : ""}
                    {device.model ?? titleCase(device.device_type)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {titleCase(device.platform)} · {titleCase(device.device_type)}
                    {device.os_version ? ` · ${device.operating_system ?? ""} ${device.os_version}` : ""}
                  </p>
                  {device.browser ? (
                    <p className="text-xs text-muted-foreground">
                      {device.browser} {device.browser_version ?? ""}
                    </p>
                  ) : null}
                  {device.rejection_reason ? (
                    <p className="mt-1 text-xs text-destructive">{device.rejection_reason}</p>
                  ) : null}
                </div>
                <StatusBadge value={device.verification_status} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() =>
                  removeDevice.mutate(device.id, {
                    onSuccess: () => toast.success("Device removed"),
                    onError: (err) => toast.error(toSafeError(err).message),
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add a device</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Select
              id="platform"
              label="Platform"
              value={form.platform}
              options={DEVICE_PLATFORMS}
              onChange={(v) => setForm({ ...form, platform: v as TesterDeviceInput["platform"] })}
            />
            <Select
              id="deviceType"
              label="Device type"
              value={form.deviceType}
              options={DEVICE_TYPES}
              onChange={(v) =>
                setForm({ ...form, deviceType: v as TesterDeviceInput["deviceType"] })
              }
            />
            <Text
              id="manufacturer"
              label="Make (optional)"
              value={form.manufacturer ?? ""}
              onChange={(v) => setForm({ ...form, manufacturer: v })}
            />
            <Text
              id="model"
              label="Model"
              value={form.model}
              onChange={(v) => setForm({ ...form, model: v })}
              error={fieldErrors["model"]}
            />
            <Text
              id="operatingSystem"
              label="Operating system (optional)"
              value={form.operatingSystem ?? ""}
              onChange={(v) => setForm({ ...form, operatingSystem: v })}
            />
            <Text
              id="osVersion"
              label="OS version (optional)"
              value={form.osVersion ?? ""}
              onChange={(v) => setForm({ ...form, osVersion: v })}
            />
            <Text
              id="browser"
              label="Main browser (optional)"
              value={form.browser ?? ""}
              onChange={(v) => setForm({ ...form, browser: v })}
            />
            <Text
              id="browserVersion"
              label="Browser version (optional)"
              value={form.browserVersion ?? ""}
              onChange={(v) => setForm({ ...form, browserVersion: v })}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={addDevice.isPending}>
                {addDevice.isPending ? "Adding…" : "Add device"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Text(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
}) {
  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.error ? <p className="mt-1 text-xs text-destructive">{props.error}</p> : null}
    </div>
  );
}

function Select(props: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <select
        id={props.id}
        className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
