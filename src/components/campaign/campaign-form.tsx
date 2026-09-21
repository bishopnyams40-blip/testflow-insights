import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  campaignDraftSchema,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  SERVICE_LABELS,
  SERVICE_TYPES,
  type CampaignFormValues,
} from "@/lib/campaign";

export const EMPTY_CAMPAIGN_FORM: CampaignFormValues = {
  name: "",
  serviceType: "USER_FEEDBACK",
  productType: "WEBSITE",
  productName: "",
  productUrl: "",
  objective: "",
  description: undefined,
  participantTarget: 10,
  deadline: "",
  loginRequired: false,
  testAccountInstructions: undefined,
  clientNotes: undefined,
};

type FieldErrors = Partial<Record<keyof CampaignFormValues, string>>;

export function CampaignForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: CampaignFormValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: CampaignFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<CampaignFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = <K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = campaignDraftSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CampaignFormValues | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Campaign
        </h2>
        <Field label="Campaign name" error={errors.name} htmlFor="name">
          <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Service" error={errors.serviceType} htmlFor="serviceType">
          <NativeSelect
            id="serviceType"
            value={values.serviceType}
            onChange={(v) => set("serviceType", v as CampaignFormValues["serviceType"])}
            options={SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] }))}
          />
        </Field>
        <Field label="Objective" error={errors.objective} htmlFor="objective">
          <Textarea
            id="objective"
            rows={3}
            value={values.objective}
            onChange={(e) => set("objective", e.target.value)}
            placeholder="What do you want to learn from this round of testing?"
          />
        </Field>
        <Field label="Extra context (optional)" error={errors.description} htmlFor="description">
          <Textarea
            id="description"
            rows={4}
            value={values.description ?? ""}
            onChange={(e) => set("description", e.target.value || undefined)}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Product
        </h2>
        <Field label="Product name" error={errors.productName} htmlFor="productName">
          <Input
            id="productName"
            value={values.productName}
            onChange={(e) => set("productName", e.target.value)}
          />
        </Field>
        <Field label="Product type" error={errors.productType} htmlFor="productType">
          <NativeSelect
            id="productType"
            value={values.productType}
            onChange={(v) => set("productType", v as CampaignFormValues["productType"])}
            options={PRODUCT_TYPES.map((p) => ({ value: p, label: PRODUCT_TYPE_LABELS[p] }))}
          />
        </Field>
        <Field label="Product link" error={errors.productUrl} htmlFor="productUrl">
          <Input
            id="productUrl"
            placeholder="https://"
            value={values.productUrl ?? ""}
            onChange={(e) => set("productUrl", e.target.value)}
          />
        </Field>
        <div className="flex items-center gap-2">
          <input
            id="loginRequired"
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={values.loginRequired}
            onChange={(e) => set("loginRequired", e.target.checked)}
          />
          <Label htmlFor="loginRequired">Testers need a sign-in to use this product</Label>
        </div>
        {values.loginRequired ? (
          <Field
            label="How testers sign in"
            error={errors.testAccountInstructions}
            htmlFor="testAccountInstructions"
          >
            <Textarea
              id="testAccountInstructions"
              rows={3}
              value={values.testAccountInstructions ?? ""}
              onChange={(e) => set("testAccountInstructions", e.target.value || undefined)}
            />
          </Field>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Scope
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Participants" error={errors.participantTarget} htmlFor="participantTarget">
            <Input
              id="participantTarget"
              type="number"
              min={1}
              value={values.participantTarget}
              onChange={(e) => set("participantTarget", Number(e.target.value))}
            />
          </Field>
          <Field label="Deadline" error={errors.deadline} htmlFor="deadline">
            <Input
              id="deadline"
              type="date"
              value={values.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Notes for the TestFlow team (optional)" error={errors.clientNotes} htmlFor="clientNotes">
          <Textarea
            id="clientNotes"
            rows={3}
            value={values.clientNotes ?? ""}
            onChange={(e) => set("clientNotes", e.target.value || undefined)}
          />
        </Field>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string | undefined;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function NativeSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      id={id}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
