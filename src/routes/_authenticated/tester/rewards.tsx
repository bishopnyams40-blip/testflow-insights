import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — TestFlow" },
      {
        name: "description",
        content: "Earnings, payout history and reward status for your completed work.",
      },
      { property: "og:title", content: "Rewards — TestFlow" },
      {
        property: "og:description",
        content: "Earnings, payout history and reward status for your completed work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterRewardsPage,
});

function TesterRewardsPage() {
  return (
    <PlaceholderPage
      title="Rewards"
      description="Earnings, payout history and reward status for your completed work."
    />
  );
}
