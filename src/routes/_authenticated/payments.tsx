import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — TestFlow" },
      {
        name: "description",
        content: "Invoices, balances and payment history for your organisation.",
      },
      { property: "og:title", content: "Payments — TestFlow" },
      {
        property: "og:description",
        content: "Invoices, balances and payment history for your organisation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <PlaceholderPage
      title="Payments"
      description="Invoices, balances and payment history for your organisation."
    />
  );
}
