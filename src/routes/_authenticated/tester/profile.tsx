import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/tester/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TestFlow" },
      {
        name: "description",
        content: "Your devices, skills and verification details used for matching.",
      },
      { property: "og:title", content: "Profile — TestFlow" },
      {
        property: "og:description",
        content: "Your devices, skills and verification details used for matching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TesterProfilePage,
});

function TesterProfilePage() {
  return (
    <PlaceholderPage
      title="Profile"
      description="Your devices, skills and verification details used for matching."
    />
  );
}
