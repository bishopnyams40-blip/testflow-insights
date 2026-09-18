import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — TestFlow" },
      { name: "description", content: "Testing campaigns your team has requested, managed end to end by TestFlow." },
      { property: "og:title", content: "Campaigns — TestFlow" },
      { property: "og:description", content: "Testing campaigns your team has requested, managed end to end by TestFlow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  return <PlaceholderPage title="Campaigns" description="Testing campaigns your team has requested, managed end to end by TestFlow." />;
}
