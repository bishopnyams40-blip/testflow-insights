import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TestFlow" },
      { name: "description", content: "Account, notification and organisation preferences." },
      { property: "og:title", content: "Settings — TestFlow" },
      {
        property: "og:description",
        content: "Account, notification and organisation preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Account, notification and organisation preferences."
    />
  );
}
