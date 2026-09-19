import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — TestFlow" },
      {
        name: "description",
        content:
          "Your private conversation with the TestFlow team. Clients and testers never speak directly.",
      },
      { property: "og:title", content: "Messages — TestFlow" },
      {
        property: "og:description",
        content:
          "Your private conversation with the TestFlow team. Clients and testers never speak directly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <PlaceholderPage
      title="Messages"
      description="Your private conversation with the TestFlow team. Clients and testers never speak directly."
    />
  );
}
