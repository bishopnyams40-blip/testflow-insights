import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/completed")({
  head: () => ({
    meta: [
      { title: "Completed — TestFlow" },
      { name: "description", content: "Work you have finished and submitted for review." },
      { property: "og:title", content: "Completed — TestFlow" },
      { property: "og:description", content: "Work you have finished and submitted for review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterCompletedPage,
});

function TesterCompletedPage() {
  return <PlaceholderPage title="Completed" description="Work you have finished and submitted for review." />;
}
