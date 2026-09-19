import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — TestFlow" },
      {
        name: "description",
        content: "People in your organisation and the access each of them has.",
      },
      { property: "og:title", content: "Team — TestFlow" },
      {
        property: "og:description",
        content: "People in your organisation and the access each of them has.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <PlaceholderPage
      title="Team"
      description="People in your organisation and the access each of them has."
    />
  );
}
