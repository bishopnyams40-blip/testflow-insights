import { describe, expect, it } from "vitest";
import {
  campaignDraftSchema,
  campaignRequirementSchema,
  campaignTaskSchema,
  calculateCoreCompleteness,
  clientActionsFor,
  requirementValueToJson,
  type CompletenessInput,
} from "./campaign";

const validDraft = {
  name: "Checkout flow feedback",
  serviceType: "USER_FEEDBACK",
  productType: "WEB_APP",
  productName: "Acme Checkout",
  productUrl: "https://app.acme.test/checkout",
  objective: "Understand where first-time buyers drop out of checkout.",
  description: "",
  participantTarget: 12,
  deadline: "2026-12-01T17:00",
  loginRequired: true,
  testAccountInstructions: "Use tester@acme.test / password123",
  clientNotes: "",
};

function baseCampaign(): CompletenessInput {
  return {
    name: "Checkout flow feedback",
    serviceType: "USER_FEEDBACK",
    objective: "Understand where first-time buyers drop out.",
    productName: "Acme Checkout",
    productType: "WEB_APP",
    productUrl: "https://app.acme.test",
    loginRequired: false,
    testAccountInstructions: null,
    participantTarget: 12,
    deadline: "2026-12-01T17:00",
  };
}

describe("campaignDraftSchema", () => {
  it("accepts a complete draft", () => {
    expect(campaignDraftSchema.safeParse(validDraft).success).toBe(true);
  });

  it("requires a product URL for websites and web apps only", () => {
    const webApp = campaignDraftSchema.safeParse({ ...validDraft, productUrl: "" });
    expect(webApp.success).toBe(false);

    const mobile = campaignDraftSchema.safeParse({ ...validDraft, productUrl: "" });
    expect(mobile.success).toBe(false);

    const other = campaignDraftSchema.safeParse({
      ...validDraft,
      productType: "MOBILE_APP",
      productUrl: "",
    });
    expect(other.success).toBe(true);
  });

  it("requires test account instructions when login is required", () => {
    const parsed = campaignDraftSchema.safeParse({
      ...validDraft,
      testAccountInstructions: "",
      productType: "MOBILE_APP",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects participant targets outside 1..1000", () => {
    expect(campaignDraftSchema.safeParse({ ...validDraft, participantTarget: 0 }).success).toBe(
      false,
    );
    expect(campaignDraftSchema.safeParse({ ...validDraft, participantTarget: 1001 }).success).toBe(
      false,
    );
  });
});

describe("campaignTaskSchema", () => {
  it("accepts a minimal task and normalises empty duration to null", () => {
    const parsed = campaignTaskSchema.parse({
      title: "Complete checkout",
      description: "",
      instructions: "",
      successCriteria: "",
      maxDuration: "",
      required: true,
    });
    expect(parsed.maxDuration).toBeNull();
  });

  it("rejects non-numeric or out-of-range durations", () => {
    expect(
      campaignTaskSchema.safeParse({ title: "Do the thing", maxDuration: 601, required: true })
        .success,
    ).toBe(false);
    expect(
      campaignTaskSchema.safeParse({ title: "Do", maxDuration: 0, required: true }).success,
    ).toBe(false);
  });
});

describe("campaignRequirementSchema + requirementValueToJson", () => {
  it("splits list values on commas", () => {
    expect(requirementValueToJson("IN", "US, GB ,")).toEqual(["US", "GB"]);
    expect(requirementValueToJson("NOT_IN", "US")).toEqual(["US"]);
  });

  it("parses boolean and numeric operators", () => {
    expect(requirementValueToJson("BOOLEAN_IS", "true")).toBe(true);
    expect(requirementValueToJson("BOOLEAN_IS", "false")).toBe(false);
    expect(requirementValueToJson("GREATER_THAN_OR_EQUAL", "18")).toBe(18);
    expect(requirementValueToJson("CONTAINS", "checkout")).toBe("checkout");
  });

  it("rejects empty values", () => {
    expect(
      campaignRequirementSchema.safeParse({
        requirementType: "COUNTRY",
        operator: "IN",
        value: "  ",
        required: true,
      }).success,
    ).toBe(false);
  });
});

describe("calculateCoreCompleteness", () => {
  it("is complete with a task and every field filled", () => {
    const result = calculateCoreCompleteness(baseCampaign(), 2);
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("lists every missing field", () => {
    const result = calculateCoreCompleteness(
      {
        ...baseCampaign(),
        name: "",
        objective: null,
        productType: null,
        deadline: null,
        participantTarget: 0,
      },
      0,
    );
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(
      expect.arrayContaining([
        "name",
        "objective",
        "product type",
        "deadline",
        "participant target",
        "tasks",
      ]),
    );
  });

  it("requires product URL and login instructions conditionally", () => {
    const noUrl = calculateCoreCompleteness({ ...baseCampaign(), productUrl: null }, 1);
    expect(noUrl.missing).toContain("product URL");

    const withLogin = calculateCoreCompleteness(
      { ...baseCampaign(), loginRequired: true, testAccountInstructions: null },
      1,
    );
    expect(withLogin.missing).toContain("test account instructions");

    const noTasks = calculateCoreCompleteness(baseCampaign(), 0);
    expect(noTasks.missing).toEqual(["tasks"]);
  });
});

describe("clientActionsFor", () => {
  it("drafts are fully editable", () => {
    const actions = clientActionsFor("DRAFT");
    expect(actions).toEqual({
      canEdit: true,
      canSubmit: true,
      canWithdraw: false,
      canCancel: true,
      canDelete: true,
    });
  });

  it("quoted campaigns can be withdrawn but not edited", () => {
    const actions = clientActionsFor("QUOTED");
    expect(actions.canEdit).toBe(false);
    expect(actions.canWithdraw).toBe(true);
    expect(actions.canSubmit).toBe(false);
  });

  it("terminal campaigns only allow no actions", () => {
    expect(clientActionsFor("CANCELLED")).toEqual({
      canEdit: false,
      canSubmit: false,
      canWithdraw: false,
      canCancel: false,
      canDelete: false,
    });
    expect(clientActionsFor("COMPLETED").canCancel).toBe(false);
    expect(clientActionsFor("CLOSED").canCancel).toBe(false);
  });
});
