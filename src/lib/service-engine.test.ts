import { describe, expect, it } from "vitest";
import { SERVICE_TYPES, type ServiceType } from "./campaign";
import {
  SERVICE_DEFINITIONS,
  getDefinition,
  getEvidenceRequirements,
  getPricingInputs,
  getReportSections,
  getRequiredFields,
  getWorkflowFlags,
  listServices,
  pruneServiceConfig,
  toServiceConfig,
  validateServiceConfiguration,
  type ServiceConfig,
} from "./service-engine";

const complete: Record<ServiceType, ServiceConfig> = {
  USER_FEEDBACK: {
    targetAudience: "First-time mobile shoppers",
    feedbackQuestions: ["What confused you?"],
    evidenceLevel: "STANDARD",
    urgency: "STANDARD",
  },
  BUG_TESTING: {
    testingScope: "Checkout and payments",
    focusAreas: ["Checkout"],
    environments: ["Android Chrome"],
    evidenceLevel: "RICH",
    urgency: "PRIORITY",
  },
  USABILITY_TESTING: {
    sessionDurationMinutes: 30,
    evidenceLevel: "RICH",
    urgency: "STANDARD",
  },
  BETA_TESTING: {
    testingDurationDays: 14,
    startDate: "2026-10-01",
    endDate: "2026-10-15",
    usageExpectations: "Use the app three times a week",
    evidenceLevel: "STANDARD",
    urgency: "STANDARD",
  },
  TARGETED_RESEARCH: {
    researchQuestions: ["How do you pay rent today?"],
    screeningRequirements: ["Rents in Nairobi"],
    responseFormat: "SHORT_ANSWER",
    evidenceLevel: "BASIC",
    urgency: "STANDARD",
  },
};

const okTasks = { taskCount: 3, tasksMissingSuccessCriteria: 0 };

describe("service definitions", () => {
  it("defines exactly the five services with unique identifiers", () => {
    const services = listServices();
    expect(services).toHaveLength(5);
    expect(new Set(services.map((s) => s.serviceType)).size).toBe(5);
    expect(services.map((s) => s.serviceType).sort()).toEqual([...SERVICE_TYPES].sort());
  });

  it("gives every service a complete definition", () => {
    for (const service of SERVICE_TYPES) {
      const definition = getDefinition(service);
      expect(definition.displayName.length).toBeGreaterThan(0);
      expect(definition.shortDescription.length).toBeGreaterThan(0);
      expect(definition.objectivePrompt.length).toBeGreaterThan(0);
      expect(definition.supportedProductTypes.length).toBeGreaterThan(0);
      expect(getRequiredFields(service).length).toBeGreaterThan(0);
      expect(definition.requirementTypes.length).toBeGreaterThan(0);
      expect(Object.keys(getEvidenceRequirements(service)).length).toBeGreaterThan(0);
      expect(definition.validationRules.length).toBeGreaterThan(0);
      expect(definition.pricingInputKeys.length).toBeGreaterThan(0);
      expect(getReportSections(service).length).toBeGreaterThan(0);
      expect(typeof getWorkflowFlags(service).ongoingParticipation).toBe("boolean");
    }
  });

  it("requires written evidence for every service", () => {
    for (const service of SERVICE_TYPES) {
      expect(getEvidenceRequirements(service).TEXT).toBe("REQUIRED");
    }
  });

  it("keeps service type separate from campaign status", () => {
    for (const definition of Object.values(SERVICE_DEFINITIONS)) {
      expect(Object.keys(definition)).not.toContain("status");
    }
  });
});

describe("service validation", () => {
  it("accepts a valid configuration for each service", () => {
    for (const service of SERVICE_TYPES) {
      const result = validateServiceConfiguration(service, complete[service], okTasks);
      expect(result, service).toEqual({ complete: true, missing: [] });
    }
  });

  it("rejects an empty configuration for each service", () => {
    for (const service of SERVICE_TYPES) {
      const result = validateServiceConfiguration(service, {}, okTasks);
      expect(result.complete, service).toBe(false);
      expect(result.missing).toContain("evidenceLevel");
      expect(result.missing).toContain("urgency");
    }
  });

  it("requires feedback questions for user feedback", () => {
    const result = validateServiceConfiguration(
      "USER_FEEDBACK",
      { ...complete.USER_FEEDBACK, feedbackQuestions: [] },
      okTasks,
    );
    expect(result.missing).toContain("feedbackQuestions");
  });

  it("requires scope, focus areas and environments for bug testing", () => {
    const result = validateServiceConfiguration(
      "BUG_TESTING",
      { evidenceLevel: "RICH", urgency: "STANDARD" },
      okTasks,
    );
    expect(result.missing).toEqual(
      expect.arrayContaining(["testingScope", "focusAreas", "environments"]),
    );
  });

  it("requires session length and task success criteria for usability testing", () => {
    const noDuration = validateServiceConfiguration(
      "USABILITY_TESTING",
      { evidenceLevel: "RICH", urgency: "STANDARD" },
      okTasks,
    );
    expect(noDuration.missing).toContain("sessionDurationMinutes");

    const noCriteria = validateServiceConfiguration("USABILITY_TESTING", complete.USABILITY_TESTING, {
      taskCount: 2,
      tasksMissingSuccessCriteria: 1,
    });
    expect(noCriteria.missing).toContain("taskSuccessCriteria");

    const noTasks = validateServiceConfiguration("USABILITY_TESTING", complete.USABILITY_TESTING, {
      taskCount: 0,
      tasksMissingSuccessCriteria: 0,
    });
    expect(noTasks.missing).toContain("taskSuccessCriteria");
  });

  it("requires a testing period for beta testing", () => {
    const result = validateServiceConfiguration(
      "BETA_TESTING",
      { ...complete.BETA_TESTING, testingDurationDays: 0 },
      okTasks,
    );
    expect(result.missing).toContain("testingDurationDays");
  });

  it("requires research questions and screening for targeted research", () => {
    const result = validateServiceConfiguration(
      "TARGETED_RESEARCH",
      { ...complete.TARGETED_RESEARCH, researchQuestions: [], screeningRequirements: [] },
      okTasks,
    );
    expect(result.missing).toEqual(
      expect.arrayContaining(["researchQuestions", "screeningRequirements"]),
    );
  });
});

describe("pricing inputs", () => {
  it("produces machine-readable inputs without any amounts", () => {
    const inputs = getPricingInputs({
      serviceType: "USABILITY_TESTING",
      participantTarget: 12,
      taskCount: 4,
      requirementCount: 2,
      config: complete.USABILITY_TESTING,
    });
    expect(inputs["participant_count"]).toBe(12);
    expect(inputs["task_count"]).toBe(4);
    expect(inputs["session_duration"]).toBe(30);
    expect(inputs["targeting_complexity"]).toBe(2);
    expect(Object.keys(inputs)).not.toContain("price");
    expect(Object.keys(inputs)).not.toContain("amount");
  });

  it("covers every declared pricing key for every service", () => {
    for (const service of SERVICE_TYPES) {
      const inputs = getPricingInputs({
        serviceType: service,
        participantTarget: 5,
        taskCount: 1,
        requirementCount: 0,
        config: complete[service],
      });
      expect(Object.keys(inputs).sort()).toEqual([...getDefinition(service).pricingInputKeys].sort());
    }
  });
});

describe("config helpers", () => {
  it("normalises unknown json safely", () => {
    expect(toServiceConfig(null)).toEqual({});
    expect(toServiceConfig({ a: "x", b: 2, c: true, d: ["e"], f: { g: 1 } })).toEqual({
      a: "x",
      b: 2,
      c: true,
      d: ["e"],
    });
  });

  it("drops keys that do not belong to the selected service", () => {
    const pruned = pruneServiceConfig("USER_FEEDBACK", {
      targetAudience: "Anyone",
      testingScope: "Should be dropped",
    });
    expect(pruned).toEqual({ targetAudience: "Anyone" });
  });
});
