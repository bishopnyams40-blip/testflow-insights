import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/jobs")({
  head: () => ({
    meta: [
      { title: "Available Jobs — TestFlow" },
      {
        name: "description",
        content: "Opportunities you may qualify for. Requesting a job is not an assignment.",
      },
      { property: "og:title", content: "Available Jobs — TestFlow" },
      {
        property: "og:description",
        content: "Opportunities you may qualify for. Requesting a job is not an assignment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterJobsPage,
});

function TesterJobsPage() {
  return (
    <PlaceholderPage
      title="Available Jobs"
      description="Opportunities you may qualify for. Requesting a job is not an assignment."
    />
  );
}
