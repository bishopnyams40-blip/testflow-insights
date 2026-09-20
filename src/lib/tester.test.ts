import { describe, expect, it } from "vitest";
import {
  calculateCompleteness,
  testerDeviceSchema,
  testerProfileSchema,
  type TesterDeviceRow,
  type TesterProfileRow,
  type TesterSkillRow,
  type TesterVerificationRow,
} from "./tester";

const profile = {
  country: "United Kingdom",
  timezone: "Europe/London",
  age_range: "25-34",
  occupation: "Designer",
  bio: "I test mobile commerce apps every week and file detailed reports.",
} as unknown as TesterProfileRow;

const device = {} as TesterDeviceRow;
const skill = {} as TesterSkillRow;
const emailVerified = {
  verification_type: "EMAIL",
  status: "VERIFIED",
} as unknown as TesterVerificationRow;

describe("profile completeness", () => {
  it("is 0% for an empty profile", () => {
    const result = calculateCompleteness({
      profile: null,
      devices: [],
      skills: [],
      verifications: [],
    });
    expect(result.percent).toBe(0);
    expect(result.missing).toContain("Country");
  });

  it("is 100% when everything is present", () => {
    const result = calculateCompleteness({
      profile,
      devices: [device],
      skills: [skill, skill, skill],
      verifications: [emailVerified],
    });
    expect(result.percent).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it("reports what is still missing", () => {
    const result = calculateCompleteness({
      profile,
      devices: [],
      skills: [],
      verifications: [],
    });
    expect(result.percent).toBeLessThan(100);
    expect(result.missing).toEqual(
      expect.arrayContaining(["At least one device", "At least three skills", "Email verified"]),
    );
  });
});

describe("validation", () => {
  it("rejects a profile without a country", () => {
    const result = testerProfileSchema.safeParse({
      country: "",
      timezone: "Europe/London",
      ageRange: "25-34",
      experienceLevel: "BEGINNER",
      availabilityStatus: "AVAILABLE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid profile", () => {
    const result = testerProfileSchema.safeParse({
      country: "Kenya",
      city: "Nairobi",
      timezone: "Africa/Nairobi",
      ageRange: "35-44",
      occupation: "QA lead",
      bio: "",
      experienceLevel: "EXPERIENCED",
      availabilityStatus: "LIMITED",
    });
    expect(result.success).toBe(true);
  });

  it("requires a device model", () => {
    const result = testerDeviceSchema.safeParse({ platform: "IPHONE", deviceType: "PHONE" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown platform", () => {
    const result = testerDeviceSchema.safeParse({
      platform: "BLACKBERRY",
      deviceType: "PHONE",
      model: "Bold",
    });
    expect(result.success).toBe(false);
  });
});
