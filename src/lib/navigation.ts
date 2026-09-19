import type { AppRole } from "@/hooks/useSession";

export interface NavItem {
  label: string;
  to: string;
}

/**
 * Role-aware navigation architecture. Screens are placeholders in this
 * foundation release; routes and access boundaries are what matter here.
 */
export const CLIENT_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Campaigns", to: "/campaigns" },
  { label: "Reports", to: "/reports" },
  { label: "Testers", to: "/testers" },
  { label: "Messages", to: "/messages" },
  { label: "Payments", to: "/payments" },
  { label: "Products", to: "/products" },
  { label: "Team", to: "/team" },
  { label: "Settings", to: "/settings" },
];

export const TESTER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/tester" },
  { label: "Profile", to: "/tester/profile" },
  { label: "Devices", to: "/tester/devices" },
  { label: "Verification", to: "/tester/verification" },
  { label: "Available Jobs", to: "/tester/jobs" },
  { label: "Requested", to: "/tester/requested" },
  { label: "Assignments", to: "/tester/assignments" },
  { label: "Completed", to: "/tester/completed" },
  { label: "Rewards", to: "/tester/rewards" },
  { label: "Support", to: "/tester/support" },
  { label: "Settings", to: "/settings" },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Operations", to: "/admin" },
  { label: "Tester network", to: "/admin/testers" },
  { label: "Campaigns", to: "/campaigns" },
  { label: "Messages", to: "/messages" },
  { label: "Settings", to: "/settings" },
];

export function navForRole(role: AppRole): NavItem[] {
  if (role === "TESTER") return TESTER_NAV;
  if (role === "ADMIN") return ADMIN_NAV;
  return CLIENT_NAV;
}

export function homeForRole(role: AppRole): string {
  if (role === "TESTER") return "/tester";
  if (role === "ADMIN") return "/admin";
  return "/dashboard";
}
