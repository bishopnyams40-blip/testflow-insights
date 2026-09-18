import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — TestFlow" },
      { name: "description", content: "Work TestFlow has formally assigned to you." },
      { property: "og:title", content: "Assignments — TestFlow" },
      { property: "og:description", content: "Work TestFlow has formally assigned to you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterAssignmentsPage,
});

function TesterAssignmentsPage() {
  return <PlaceholderPage title="Assignments" description="Work TestFlow has formally assigned to you." />;
}
