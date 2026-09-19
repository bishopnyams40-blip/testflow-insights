import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/support")({
  head: () => ({
    meta: [
      { title: "Support — TestFlow" },
      { name: "description", content: "Reach the TestFlow team for help with your testing work." },
      { property: "og:title", content: "Support — TestFlow" },
      {
        property: "og:description",
        content: "Reach the TestFlow team for help with your testing work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterSupportPage,
});

function TesterSupportPage() {
  return (
    <PlaceholderPage
      title="Support"
      description="Reach the TestFlow team for help with your testing work."
    />
  );
}
