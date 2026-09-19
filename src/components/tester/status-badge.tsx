import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/tester";

type Tone = "default" | "secondary" | "destructive" | "outline";

const TONES: Record<string, Tone> = {
  VERIFIED: "default",
  ACTIVE: "default",
  AVAILABLE: "default",
  PENDING: "secondary",
  LIMITED: "secondary",
  BUSY: "secondary",
  NOT_STARTED: "outline",
  UNVERIFIED: "outline",
  UNAVAILABLE: "outline",
  DEACTIVATED: "outline",
  REJECTED: "destructive",
  FAILED: "destructive",
  EXPIRED: "destructive",
  SUSPENDED: "destructive",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return <Badge variant={TONES[value] ?? "outline"}>{label ?? titleCase(value)}</Badge>;
}
