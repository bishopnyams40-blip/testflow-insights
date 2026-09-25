import { describe, expect, it } from "vitest";
import {
  applyApproval,
  canAdminReview,
  canTransitionOpp,
  canWithdraw,
  holdsPlace,
  isRequestable,
} from "./recruitment";

const now = new Date("2026-09-25T12:00:00Z");
const base = {
  status: "OPEN" as const,
  opens_at: "2026-09-20T00:00:00Z",
  closes_at: "2026-10-20T00:00:00Z",
  slots_total: 2,
  slots_requested: 0,
};

describe("opportunity lifecycle", () => {
  it("allows valid transitions", () => {
    expect(canTransitionOpp("DRAFT", "OPEN")).toBe(true);
    expect(canTransitionOpp("OPEN", "PAUSED")).toBe(true);
    expect(canTransitionOpp("PAUSED", "OPEN")).toBe(true);
  });
  it("rejects invalid transitions", () => {
    expect(canTransitionOpp("CLOSED", "OPEN")).toBe(false);
    expect(canTransitionOpp("CANCELLED", "OPEN")).toBe(false);
    expect(canTransitionOpp("DRAFT", "FULL")).toBe(false);
  });
});

describe("requestability", () => {
  it("accepts open, in-window, under capacity", () => expect(isRequestable(base, now)).toBe(true));
  it.each(["PAUSED", "CLOSED", "EXPIRED", "CANCELLED", "FULL", "DRAFT"] as const)(
    "blocks %s",
    (status) => expect(isRequestable({ ...base, status }, now)).toBe(false),
  );
  it("enforces opening date", () =>
    expect(isRequestable({ ...base, opens_at: "2026-09-30T00:00:00Z" }, now)).toBe(false));
  it("enforces closing date", () =>
    expect(isRequestable({ ...base, closes_at: "2026-09-24T00:00:00Z" }, now)).toBe(false));
  it("enforces capacity", () =>
    expect(isRequestable({ ...base, slots_requested: 2 }, now)).toBe(false));
});

describe("job requests", () => {
  it("withdrawal only before a decision", () => {
    expect(canWithdraw("REQUESTED")).toBe(true);
    expect(canWithdraw("UNDER_REVIEW")).toBe(true);
    expect(canWithdraw("APPROVED")).toBe(false);
    expect(canWithdraw("REJECTED")).toBe(false);
  });
  it("review transitions", () => {
    expect(canAdminReview("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canAdminReview("APPROVED", "REJECTED")).toBe(false);
    expect(canAdminReview("WITHDRAWN", "APPROVED")).toBe(false);
  });
  it("terminal requests release their place", () => {
    expect(holdsPlace("WITHDRAWN")).toBe(false);
    expect(holdsPlace("REJECTED")).toBe(false);
    expect(holdsPlace("APPROVED")).toBe(true);
  });
  it("approval does not fill a place", () =>
    expect(applyApproval({ slots_filled: 0 }).slots_filled).toBe(0));
});
