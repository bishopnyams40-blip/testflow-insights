import { listServices } from "@/lib/service-engine";
import type { ServiceType } from "@/lib/campaign";
import { cn } from "@/lib/utils";

export function ServicePicker({
  value,
  onSelect,
}: {
  value?: ServiceType | null;
  onSelect: (serviceType: ServiceType) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {listServices().map((service) => {
        const selected = value === service.serviceType;
        return (
          <button
            key={service.serviceType}
            type="button"
            onClick={() => onSelect(service.serviceType)}
            className={cn(
              "rounded-xl border bg-card p-5 text-left transition hover:border-primary",
              selected && "border-primary ring-1 ring-primary",
            )}
          >
            <p className="font-medium">{service.displayName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{service.shortDescription}</p>
          </button>
        );
      })}
    </div>
  );
}
