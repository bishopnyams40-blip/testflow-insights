import { EmptyState } from "@/components/states";

interface PlaceholderPageProps {
  title: string;
  description: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Foundation-release screen. The data model and access rules behind each
 * section exist; the working screens arrive in later releases.
 */
export function PlaceholderPage({
  title,
  description,
  emptyTitle = "Nothing here yet",
  emptyDescription = "This section is part of the TestFlow foundation. Its data model and access rules are in place, and the full experience comes next.",
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
