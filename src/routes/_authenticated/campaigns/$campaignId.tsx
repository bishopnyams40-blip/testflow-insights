import { useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { CampaignForm, Field, NativeSelect } from "@/components/campaign/campaign-form";
import { useSession } from "@/hooks/useSession";
import {
  useCampaign,
  useCampaignLifecycle,
  useCampaignRequirementActions,
  useCampaignTaskActions,
  useUpdateCampaign,
} from "@/hooks/useCampaigns";
import {
  clientActionsFor,
  formatRequirementValue,
  OPERATOR_LABELS,
  PRODUCT_TYPE_LABELS,
  REQUIREMENT_OPERATORS,
  REQUIREMENT_TYPES,
  SERVICE_LABELS,
  STATUS_LABELS,
  type CampaignFormValues,
  type CampaignRequirementInput,
  type CampaignTaskInput,
  type RequirementOperator,
  type RequirementType,
} from "@/lib/campaign";
import {
  fieldLabel,
  formatConfigValue,
  getDefinition,
  EVIDENCE_LABELS,
  type EvidenceType,
} from "@/lib/service-engine";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/campaigns/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign — TestFlow" },
      { name: "description", content: "Campaign brief, tasks, tester requirements and status." },
      { property: "og:title", content: "Campaign — TestFlow" },
      {
        property: "og:description",
        content: "Campaign brief, tasks, tester requirements and status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = useSession();
  const { data, isPending, error, refetch } = useCampaign(campaignId);
  const [editing, setEditing] = useState(false);
  const update = useUpdateCampaign(campaignId);
  const lifecycle = useCampaignLifecycle(campaignId);

  if (sessionPending || isPending) return <LoadingState label="Loading campaign" />;
  if (!session) return <Navigate to="/auth" />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data)
    return (
      <EmptyState
        title="Campaign not available"
        description="This campaign doesn't exist, or it belongs to another organisation."
        action={
          <Button asChild variant="outline">
            <Link to="/campaigns">Back to campaigns</Link>
          </Button>
        }
      />
    );

  const { campaign, tasks, requirements, completeness, serviceConfig, serviceCompleteness } = data;
  const actions = clientActionsFor(campaign.status);
  const definition = getDefinition(campaign.service_type);
  const readyToSend = completeness.complete && serviceCompleteness.complete;

  const initial: CampaignFormValues = {
    name: campaign.name,
    serviceType: campaign.service_type,
    productType: campaign.product_type ?? "WEBSITE",
    productName: campaign.product_name ?? "",
    productUrl: campaign.product_url ?? "",
    objective: campaign.objective ?? "",
    description: campaign.description ?? undefined,
    participantTarget: campaign.participant_target,
    deadline: campaign.deadline ? campaign.deadline.slice(0, 10) : "",
    loginRequired: campaign.login_required,
    testAccountInstructions: campaign.test_account_instructions ?? undefined,
    clientNotes: campaign.client_notes ?? undefined,
  };


  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/campaigns" className="text-sm text-muted-foreground hover:underline">
            ← All campaigns
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{campaign.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SERVICE_LABELS[campaign.service_type]} ·{" "}
            {campaign.product_type
              ? PRODUCT_TYPE_LABELS[campaign.product_type]
              : "Product type not set"}
          </p>
        </div>
        <Badge variant="secondary">{STATUS_LABELS[campaign.status]}</Badge>
      </header>

      {actions.canEdit && !readyToSend ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium">Still needed before you can send this to TestFlow</p>
          <p className="mt-1 text-muted-foreground">
            {[
              ...completeness.missing,
              ...serviceCompleteness.missing.map((k) => fieldLabel(campaign.service_type, k)),
            ].join(", ")}
          </p>
        </div>
      ) : null}

      {editing ? (
        <CampaignForm
          initial={initial}
          initialConfig={serviceConfig}
          lockService
          submitLabel="Save changes"
          pending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(values, config) =>
            update.mutate({ values, config }, {
              onSuccess: () => {
                toast.success("Campaign updated");
                setEditing(false);
              },
              onError: (err) => toast.error(toSafeError(err).message),
            })
          }
        />
      ) : (
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Brief
            </h2>
            {actions.canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : null}
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Product" value={campaign.product_name ?? "—"} />
            <Detail label="Link" value={campaign.product_url ?? "—"} />
            <Detail label="Participants" value={String(campaign.participant_target)} />
            <Detail
              label="Deadline"
              value={campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : "—"}
            />
            <Detail label="Sign-in needed" value={campaign.login_required ? "Yes" : "No"} />
            <Detail label="Objective" value={campaign.objective ?? "—"} />
          </dl>
          {campaign.description ? (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {campaign.description}
            </p>
          ) : null}
          {campaign.cancellation_reason ? (
            <p className="text-sm text-destructive">Cancelled: {campaign.cancellation_reason}</p>
          ) : null}
        </section>
      )}

      <TasksSection campaignId={campaignId} tasks={tasks} editable={actions.canEdit} />
      <RequirementsSection
        campaignId={campaignId}
        requirements={requirements}
        editable={actions.canEdit}
      />

      <section className="flex flex-wrap gap-3 rounded-xl border bg-card p-6">
        {actions.canSubmit ? (
          <Button
            disabled={!completeness.complete || lifecycle.submit.isPending}
            onClick={() =>
              lifecycle.submit.mutate(undefined, {
                onSuccess: () => toast.success("Sent to TestFlow for quoting"),
                onError: (err) => toast.error(toSafeError(err).message),
              })
            }
          >
            Send to TestFlow
          </Button>
        ) : null}
        {actions.canWithdraw ? (
          <Button
            variant="outline"
            onClick={() =>
              lifecycle.withdraw.mutate(undefined, {
                onSuccess: () => toast.success("Moved back to draft"),
                onError: (err) => toast.error(toSafeError(err).message),
              })
            }
          >
            Return to draft
          </Button>
        ) : null}
        {actions.canCancel ? <CancelButton campaignId={campaignId} /> : null}
        {actions.canDelete ? (
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() =>
              lifecycle.remove.mutate(undefined, {
                onSuccess: () => {
                  toast.success("Draft deleted");
                  void navigate({ to: "/campaigns" });
                },
                onError: (err) => toast.error(toSafeError(err).message),
              })
            }
          >
            Delete draft
          </Button>
        ) : null}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}

function CancelButton({ campaignId }: { campaignId: string }) {
  const lifecycle = useCampaignLifecycle(campaignId);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  if (!open)
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Cancel campaign
      </Button>
    );

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="cancel-reason">Why are you cancelling?</Label>
        <Input
          id="cancel-reason"
          className="mt-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          disabled={reason.trim().length < 3 || lifecycle.cancel.isPending}
          onClick={() =>
            lifecycle.cancel.mutate(reason.trim(), {
              onSuccess: () => {
                toast.success("Campaign cancelled");
                setOpen(false);
              },
              onError: (err) => toast.error(toSafeError(err).message),
            })
          }
        >
          Confirm
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Keep it
        </Button>
      </div>
    </div>
  );
}

const EMPTY_TASK: CampaignTaskInput = {
  title: "",
  description: undefined,
  instructions: undefined,
  successCriteria: undefined,
  maxDuration: null,
  required: true,
};

function TasksSection({
  campaignId,
  tasks,
  editable,
}: {
  campaignId: string;
  tasks: {
    id: string;
    title: string;
    instructions: string | null;
    sequence: number;
    required: boolean;
    description: string | null;
    success_criteria: string | null;
    max_duration: number | null;
    campaign_id: string;
    created_at: string;
    updated_at: string;
  }[];
  editable: boolean;
}) {
  const { addTask, deleteTask, moveTask } = useCampaignTaskActions(campaignId);
  const [draft, setDraft] = useState<CampaignTaskInput>(EMPTY_TASK);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Tasks testers will complete
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      ) : (
        <ol className="space-y-3">
          {tasks.map((task, index) => (
            <li key={task.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {index + 1}. {task.title}
                    {task.required ? "" : " (optional)"}
                  </p>
                  {task.instructions ? (
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {task.instructions}
                    </p>
                  ) : null}
                  {task.max_duration ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Up to {task.max_duration} minutes
                    </p>
                  ) : null}
                </div>
                {editable ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => moveTask.mutate({ tasks, from: index, to: index - 1 })}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === tasks.length - 1}
                      onClick={() => moveTask.mutate({ tasks, from: index, to: index + 1 })}
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      {editable ? (
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <Field label="Task title" htmlFor="task-title" error={error ?? undefined}>
            <Input
              id="task-title"
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            />
          </Field>
          <Field label="Instructions (optional)" htmlFor="task-instructions">
            <Textarea
              id="task-instructions"
              rows={3}
              value={draft.instructions ?? ""}
              onChange={(e) =>
                setDraft((p) => ({ ...p, instructions: e.target.value || undefined }))
              }
            />
          </Field>
          <Field label="Time limit in minutes (optional)" htmlFor="task-duration">
            <Input
              id="task-duration"
              type="number"
              min={1}
              value={draft.maxDuration ?? ""}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  maxDuration: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </Field>
          <Button
            variant="outline"
            disabled={addTask.isPending}
            onClick={() =>
              addTask.mutate(
                { input: draft, sequence: tasks.length + 1 },
                {
                  onSuccess: () => {
                    setDraft(EMPTY_TASK);
                    setError(null);
                  },
                  onError: (err) => setError(toSafeError(err).message),
                },
              )
            }
          >
            Add task
          </Button>
        </div>
      ) : null}
    </section>
  );
}

const EMPTY_REQUIREMENT: CampaignRequirementInput = {
  requirementType: "COUNTRY",
  operator: "EQUALS",
  value: "",
  required: true,
};

function RequirementsSection({
  campaignId,
  requirements,
  editable,
}: {
  campaignId: string;
  requirements: {
    id: string;
    requirement_type: string;
    operator: RequirementOperator;
    value: unknown;
    required: boolean;
  }[];
  editable: boolean;
}) {
  const { addRequirement, deleteRequirement } = useCampaignRequirementActions(campaignId);
  const [draft, setDraft] = useState<CampaignRequirementInput>(EMPTY_REQUIREMENT);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Who should test it
      </h2>
      {requirements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No specific requirements — TestFlow will choose a suitable mix of testers.
        </p>
      ) : (
        <ul className="space-y-2">
          {requirements.map((req) => (
            <li
              key={req.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span>
                {req.requirement_type.replaceAll("_", " ").toLowerCase()}{" "}
                {OPERATOR_LABELS[req.operator]} {formatRequirementValue(req.value)}
                {req.required ? "" : " (nice to have)"}
              </span>
              {editable ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteRequirement.mutate(req.id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editable ? (
        <div className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-3">
          <Field label="Attribute" htmlFor="req-type">
            <NativeSelect
              id="req-type"
              value={draft.requirementType}
              onChange={(v) => setDraft((p) => ({ ...p, requirementType: v as RequirementType }))}
              options={REQUIREMENT_TYPES.map((t) => ({
                value: t,
                label: t.replaceAll("_", " ").toLowerCase(),
              }))}
            />
          </Field>
          <Field label="Condition" htmlFor="req-op">
            <NativeSelect
              id="req-op"
              value={draft.operator}
              onChange={(v) => setDraft((p) => ({ ...p, operator: v as RequirementOperator }))}
              options={REQUIREMENT_OPERATORS.map((o) => ({ value: o, label: OPERATOR_LABELS[o] }))}
            />
          </Field>
          <Field label="Value" htmlFor="req-value" error={error ?? undefined}>
            <Input
              id="req-value"
              value={draft.value}
              onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))}
            />
          </Field>
          <div className="sm:col-span-3">
            <Button
              variant="outline"
              disabled={addRequirement.isPending}
              onClick={() =>
                addRequirement.mutate(draft, {
                  onSuccess: () => {
                    setDraft(EMPTY_REQUIREMENT);
                    setError(null);
                  },
                  onError: (err) => setError(toSafeError(err).message),
                })
              }
            >
              Add requirement
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
