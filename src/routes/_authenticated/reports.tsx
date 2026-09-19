import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TestFlow" },
      {
        name: "description",
        content: "Findings, evidence and summaries delivered from completed testing work.",
      },
      { property: "og:title", content: "Reports — TestFlow" },
      {
        property: "og:description",
        content: "Findings, evidence and summaries delivered from completed testing work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="Findings, evidence and summaries delivered from completed testing work."
    />
  );
}
