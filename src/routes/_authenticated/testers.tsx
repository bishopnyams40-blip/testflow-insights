import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/testers")({
  head: () => ({
    meta: [
      { title: "Testers — TestFlow" },
      {
        name: "description",
        content: "Anonymised coverage of the tester pool assigned to your work by TestFlow.",
      },
      { property: "og:title", content: "Testers — TestFlow" },
      {
        property: "og:description",
        content: "Anonymised coverage of the tester pool assigned to your work by TestFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestersPage,
});

function TestersPage() {
  return (
    <PlaceholderPage
      title="Testers"
      description="Anonymised coverage of the tester pool assigned to your work by TestFlow."
    />
  );
}
