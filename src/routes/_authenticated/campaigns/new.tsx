import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoadingState, EmptyState } from "@/components/states";
import { CampaignForm, EMPTY_CAMPAIGN_FORM } from "@/components/campaign/campaign-form";
import { useSession } from "@/hooks/useSession";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { toSafeError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — TestFlow" },
      {
        name: "description",
        content: "Describe your product and objective, and TestFlow will run the testing round.",
      },
      { property: "og:title", content: "New campaign — TestFlow" },
      {
        property: "og:description",
        content: "Describe your product and objective, and TestFlow will run the testing round.",
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">New campaign</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This saves as a draft. You can add tasks and requirements before sending it to TestFlow.
        </p>
      </header>
      <CampaignForm
        initial={EMPTY_CAMPAIGN_FORM}
        submitLabel="Save draft"
        pending={create.isPending}
        onCancel={() => void navigate({ to: "/campaigns" })}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (id) => {
              toast.success("Draft campaign created");
              void navigate({ to: "/campaigns/$campaignId", params: { campaignId: id } });
            },
            onError: (err) => toast.error(toSafeError(err).message),
          })
        }
      />
    </div>
  );
}
