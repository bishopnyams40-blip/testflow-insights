import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/requested")({
  head: () => ({
    meta: [
      { title: "Requested — TestFlow" },
      {
        name: "description",
        content: "Jobs you have asked to join, awaiting a decision from TestFlow.",
      },
      { property: "og:title", content: "Requested — TestFlow" },
      {
        property: "og:description",
        content: "Jobs you have asked to join, awaiting a decision from TestFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterRequestedPage,
});

function TesterRequestedPage() {
  return (
    <PlaceholderPage
      title="Requested"
      description="Jobs you have asked to join, awaiting a decision from TestFlow."
    />
  );
}
