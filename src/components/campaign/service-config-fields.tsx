import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/campaign/campaign-form";
import {
  getDefinition,
  type ServiceConfig,
  type ServiceConfigValue,
  type ServiceFieldSpec,
} from "@/lib/service-engine";
import type { ServiceType } from "@/lib/campaign";

export function ServiceConfigFields({
  serviceType,
  config,
  errors,
  onChange,
}: {
  serviceType: ServiceType;
  config: ServiceConfig;
  errors?: Record<string, string>;
  onChange: (key: string, value: ServiceConfigValue) => void;
}) {
  const definition = getDefinition(serviceType);

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {definition.displayName} setup
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{definition.objectivePrompt}</p>
      </div>
      {definition.fields.map((field) => (
        <ConfigField
          key={field.key}
          field={field}
          value={config[field.key]}
          error={errors?.[field.key]}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </section>
  );
}

function ConfigField({
  field,
  value,
  error,
  onChange,
}: {
  field: ServiceFieldSpec;
  value: ServiceConfigValue | undefined;
  error?: string | undefined;
  onChange: (value: ServiceConfigValue) => void;
}) {
  const id = `svc-${field.key}`;
  const label = field.required ? field.label : `${field.label} (optional)`;

  return (
    <Field label={label} htmlFor={id} error={error}>
      {field.kind === "textarea" ? (
        <Textarea
          id={id}
          rows={3}
          placeholder={field.placeholder ?? ""}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.kind === "list" ? (
        <Textarea
          id={id}
          rows={4}
          placeholder={field.placeholder ?? "One per line"}
          value={Array.isArray(value) ? value.join("\n") : ""}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.length > 0),
            )
          }
        />
      ) : field.kind === "select" ? (
        <NativeSelect
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          options={field.options ?? []}
          placeholder="Choose one"
        />
      ) : (
        <Input
          id={id}
          type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
          min={field.kind === "number" ? 1 : undefined}
          placeholder={field.placeholder ?? ""}
          value={value == null ? "" : String(value)}
          onChange={(e) =>
            onChange(
              field.kind === "number"
                ? e.target.value === ""
                  ? ""
                  : Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </Field>
  );
}
