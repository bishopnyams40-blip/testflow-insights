import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  role: Database["public"]["Enums"]["org_member_role"];
}

export interface SessionSnapshot {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: Database["public"]["Enums"]["user_status"];
  roles: AppRole[];
  primaryRole: AppRole;
  memberships: OrganizationMembership[];
  activeOrganizationId: string | null;
}

/** Authenticated-user retrieval ("/auth/me" equivalent), validated against the auth server. */
export async function fetchSession(): Promise<SessionSnapshot | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const user = userData.user;

  const [profileResult, rolesResult, membershipResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("status", "ACTIVE"),
  ]);

  const roles = (rolesResult.data ?? []).map((row) => row.role as AppRole);
  const memberships: OrganizationMembership[] = (membershipResult.data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: (row.organizations as { name: string } | null)?.name ?? "Organisation",
    role: row.role,
  }));

  const primaryRole: AppRole = roles.includes("ADMIN")
    ? "ADMIN"
    : roles.includes("TESTER")
      ? "TESTER"
      : "CLIENT";

  return {
    userId: user.id,
    email: profileResult.data?.email ?? user.email ?? "",
    firstName: profileResult.data?.first_name ?? null,
    lastName: profileResult.data?.last_name ?? null,
    status: profileResult.data?.status ?? "PENDING",
    roles,
    primaryRole,
    memberships,
    activeOrganizationId: memberships[0]?.organizationId ?? null,
  };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 30_000,
  });
}

export function displayName(session: SessionSnapshot | null | undefined) {
  if (!session) return "";
  const name = [session.firstName, session.lastName].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : session.email;
}
