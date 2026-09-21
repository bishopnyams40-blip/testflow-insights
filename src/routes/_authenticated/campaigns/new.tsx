import { useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/states";
import { CampaignForm, EMPTY_CAMPAIGN_FORM } from "@/components/campaign/campaign-form";
import { ServicePicker } from "@/components/campaign/service-picker";
import { useSession } from "@/hooks/useSession";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { toSafeError } from "@/lib/errors";
import type { ServiceType } from "@/lib/campaign";
import { getDefinition } from "@/lib/service-engine";

export const Route = createFileRoute("/_authenticated/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — TestFlow" },
      {
        name: "description",
        content: "Choose a testing service and TestFlow will run the round for you.",
      },
      { property: "og:title", content: "New campaign — TestFlow" },
      {
        property: "og:description",
        content: "Choose a testing service and TestFlow will run the round for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewCampaignPage,
});

function NewCampaignPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceType | null>(null);
  const organizationId = session?.activeOrganizationId ?? null;
  const create = useCreateCampaign(organizationId, session?.userId);

  if (isPending) return <LoadingState label="Loading" />;
  if (!session) return <Navigate to="/auth" />;
  if (!organizationId)
    return (
      <EmptyState
        title="No organisation yet"
        description="Your account isn't linked to an organisation, so campaigns can't be created yet."
      />
    );

  if (!service)
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">What do you need?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a service and TestFlow will only ask for what that service needs.
          </p>
        </header>
        <ServicePicker value={service} onSelect={setService} />
      </div>
    );

  const definition = getDefinition(service);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setService(null)}>
          ← Change service
        </Button>
        <h1 className="mt-2 text-2xl font-semibold">{definition.displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {definition.shortDescription} This saves as a draft — you can keep editing before sending
          it to TestFlow.
        </p>
      </header>
      <CampaignForm
        initial={{ ...EMPTY_CAMPAIGN_FORM, serviceType: service }}
        submitLabel="Save draft"
        pending={create.isPending}
        lockService
        onCancel={() => void navigate({ to: "/campaigns" })}
        onSubmit={(values, config) =>
          create.mutate(
            { values, config },
            {
              onSuccess: (id) => {
                toast.success("Draft campaign created");
                void navigate({ to: "/campaigns/$campaignId", params: { campaignId: id } });
              },
              onError: (err) => toast.error(toSafeError(err).message),
            },
          )
        }
      />
    </div>
  );
}
