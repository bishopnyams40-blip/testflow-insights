import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/states";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg p-8">
      <ErrorState error={error} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg p-8 text-sm text-muted-foreground">Page not found.</div>
  ),
});
