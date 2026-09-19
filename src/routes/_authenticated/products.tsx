import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Products — TestFlow" },
      {
        name: "description",
        content: "The apps, sites and builds your organisation submits for testing.",
      },
      { property: "og:title", content: "Products — TestFlow" },
      {
        property: "og:description",
        content: "The apps, sites and builds your organisation submits for testing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <PlaceholderPage
      title="Products"
      description="The apps, sites and builds your organisation submits for testing."
    />
  );
}
