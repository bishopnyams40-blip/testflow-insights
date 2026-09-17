import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TestFlow — Managed Software Testing & User Research" },
      {
        name: "description",
        content:
          "TestFlow is a managed testing platform: describe what you need tested, and we recruit testers, run quality control and deliver the findings.",
      },
      { property: "og:title", content: "TestFlow — Managed Software Testing & User Research" },
      {
        property: "og:description",
        content:
          "Describe what you need tested. TestFlow handles recruitment, testing, quality control and reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { title: "Describe the outcome", body: "Create a campaign for your app, website, or product." },
  { title: "We run the operation", body: "TestFlow recruits, assigns and supervises the testers." },
  { title: "You get the findings", body: "Quality-checked results, analysis and a clear report." },
];

const SERVICES = [
  "User feedback",
  "Bug testing",
  "Usability testing",
  "Beta testing",
  "Targeted research",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <span className="font-display text-lg font-semibold">TestFlow</span>
        <Link
          to="/auth"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
          Managed testing and user research for digital products.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          You describe what needs testing. We handle recruitment, testing, quality control and
          reporting — and hand you the findings. TestFlow is not a freelancer marketplace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Get started
          </Link>
          <Link to="/auth" className="rounded-md border px-5 py-2.5 text-sm font-medium">
            Join as a tester
          </Link>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-xl border bg-card p-6">
              <span className="text-xs font-semibold text-primary">STEP {index + 1}</span>
              <h2 className="mt-2 text-base font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Services
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SERVICES.map((service) => (
              <li key={service} className="rounded-full border bg-card px-3 py-1 text-sm">
                {service}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
