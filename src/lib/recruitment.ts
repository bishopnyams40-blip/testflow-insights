/**
 * Recruitment rules mirrored from the database (authoritative).
 * Used for UI decisions and documented by tests; the server re-enforces every rule.
 */
export type OppStatus = "DRAFT" | "OPEN" | "PAUSED" | "FULL" | "CLOSED" | "EXPIRED" | "CANCELLED";
export type ReqStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

export const OPP_TRANSITIONS: Record<OppStatus, OppStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["PAUSED", "FULL", "CLOSED", "EXPIRED", "CANCELLED"],
  PAUSED: ["OPEN", "CLOSED", "CANCELLED"],
  FULL: ["OPEN", "CLOSED", "CANCELLED"],
  CLOSED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export const ADMIN_REQ_TRANSITIONS: Record<ReqStatus, ReqStatus[]> = {
  REQUESTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "EXPIRED"],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
  EXPIRED: [],
};

export const canTransitionOpp = (from: OppStatus, to: OppStatus) =>
  OPP_TRANSITIONS[from].includes(to);
export const canAdminReview = (from: ReqStatus, to: ReqStatus) =>
  ADMIN_REQ_TRANSITIONS[from].includes(to);
export const canWithdraw = (s: ReqStatus) => s === "REQUESTED" || s === "UNDER_REVIEW";
/** Requests that hold a place (count toward slots_requested). */
export const holdsPlace = (s: ReqStatus) =>
  s === "REQUESTED" || s === "UNDER_REVIEW" || s === "APPROVED";

export function isRequestable(
  o: { status: OppStatus; opens_at: string | null; closes_at: string | null; slots_total: number; slots_requested: number },
  now: Date,
) {
  if (o.status !== "OPEN") return false;
  if (o.opens_at && new Date(o.opens_at) > now) return false;
  if (o.closes_at && new Date(o.closes_at) <= now) return false;
  return o.slots_requested < o.slots_total;
}

/** Approval never fills a place: slots_filled is owned by the future Assignment step. */
export function applyApproval<T extends { slots_filled: number }>(o: T): T {
  return { ...o };
}
