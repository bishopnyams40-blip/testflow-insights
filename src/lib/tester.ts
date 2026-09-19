import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TesterProfileRow = Tables["tester_profiles"]["Row"];
export type TesterDeviceRow = Tables["tester_devices"]["Row"];
export type TesterSkillRow = Tables["tester_skills"]["Row"];
export type TesterVerificationRow = Tables["tester_verifications"]["Row"];

export type DevicePlatform = Database["public"]["Enums"]["device_platform"];
export type DeviceType = Database["public"]["Enums"]["device_type"];
export type ExperienceLevel = Database["public"]["Enums"]["experience_level"];
export type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type VerificationType = Database["public"]["Enums"]["verification_type"];
export type AttributeVerificationStatus =
  Database["public"]["Enums"]["attribute_verification_status"];
export type AccountStatus = Database["public"]["Enums"]["user_status"];

/** Controlled vocabularies. Extending a list here never requires a schema change. */
export const DEVICE_PLATFORMS: { value: DevicePlatform; label: string }[] = [
  { value: "IPHONE", label: "iPhone" },
  { value: "ANDROID", label: "Android phone" },
  { value: "IPAD", label: "iPad / Android tablet" },
  { value: "MAC", label: "Mac" },
  { value: "WINDOWS", label: "Windows PC" },
  { value: "LINUX", label: "Linux PC" },
  { value: "OTHER", label: "Other" },
];

export const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: "PHONE", label: "Phone" },
  { value: "TABLET", label: "Tablet" },
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "WEARABLE", label: "Wearable" },
  { value: "TV", label: "TV" },
  { value: "OTHER", label: "Other" },
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "EXPERIENCED", label: "Experienced" },
  { value: "EXPERT", label: "Expert" },
];

export const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "LIMITED", label: "Limited" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;

export const SKILL_CATALOG: { category: string; skills: string[] }[] = [
  {
    category: "Testing",
    skills: [
      "Functional testing",
      "Exploratory testing",
      "Regression testing",
      "Bug reporting",
      "Test case execution",
    ],
  },
  {
    category: "Research",
    skills: ["Usability testing", "Moderated interviews", "Survey feedback", "First impressions"],
  },
  {
    category: "Platforms",
    skills: ["Mobile apps", "Web apps", "Desktop software", "E-commerce", "Fintech apps"],
  },
  {
    category: "Specialist",
    skills: ["Accessibility", "Localisation", "Performance", "API testing", "Security awareness"],
  },
];

export const ALL_SKILLS = SKILL_CATALOG.flatMap((group) => group.skills);

export const VERIFICATION_TYPES: { value: VerificationType; label: string; hint: string }[] = [
  { value: "EMAIL", label: "Email", hint: "Confirmed during sign-up." },
  { value: "PHONE", label: "Phone", hint: "A reachable phone number." },
  { value: "COUNTRY", label: "Country", hint: "Where you are based." },
  { value: "IDENTITY", label: "Identity", hint: "Reviewed by TestFlow staff." },
  { value: "DEVICE", label: "Devices", hint: "At least one confirmed device." },
  { value: "SKILL", label: "Skills", hint: "Skills confirmed by TestFlow." },
];

/** Validation shared by the forms and re-checked by the database. */
export const testerProfileSchema = z.object({
  country: z.string().trim().min(2, "Country is required").max(80),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  timezone: z.string().trim().min(2, "Timezone is required").max(80),
  ageRange: z.enum(AGE_RANGES),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERIENCED", "ADVANCED", "EXPERT"]),
  availabilityStatus: z.enum(["AVAILABLE", "LIMITED", "BUSY", "UNAVAILABLE"]),
});

export const testerDeviceSchema = z.object({
  platform: z.enum(["IPHONE", "ANDROID", "IPAD", "MAC", "WINDOWS", "LINUX", "OTHER"]),
  deviceType: z.enum(["PHONE", "TABLET", "LAPTOP", "DESKTOP", "WEARABLE", "TV", "OTHER"]),
  manufacturer: z.string().trim().max(80).optional().or(z.literal("")),
  model: z.string().trim().min(1, "Model is required").max(80),
  operatingSystem: z.string().trim().max(80).optional().or(z.literal("")),
  osVersion: z.string().trim().max(40).optional().or(z.literal("")),
  browser: z.string().trim().max(60).optional().or(z.literal("")),
  browserVersion: z.string().trim().max(40).optional().or(z.literal("")),
});

export const testerSkillSchema = z.object({
  skill: z.string().trim().min(2).max(80),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERIENCED", "ADVANCED", "EXPERT"]),
});

export type TesterProfileInput = z.infer<typeof testerProfileSchema>;
export type TesterDeviceInput = z.infer<typeof testerDeviceSchema>;
export type TesterSkillInput = z.infer<typeof testerSkillSchema>;

export interface CompletenessItem {
  label: string;
  done: boolean;
}

export interface Completeness {
  percent: number;
  items: CompletenessItem[];
  missing: string[];
}

/** Profile completeness is derived, never stored, so it can never drift. */
export function calculateCompleteness(input: {
  profile: TesterProfileRow | null;
  devices: TesterDeviceRow[];
  skills: TesterSkillRow[];
  verifications: TesterVerificationRow[];
}): Completeness {
  const p = input.profile;
  const emailVerified = input.verifications.some(
    (v) => v.verification_type === "EMAIL" && v.status === "VERIFIED",
  );
  const items: CompletenessItem[] = [
    { label: "Country", done: Boolean(p?.country) },
    { label: "Timezone", done: Boolean(p?.timezone) },
    { label: "Age range", done: Boolean(p?.age_range) },
    { label: "Occupation", done: Boolean(p?.occupation) },
    { label: "About you", done: Boolean(p?.bio && p.bio.trim().length >= 20) },
    { label: "At least one device", done: input.devices.length > 0 },
    { label: "At least three skills", done: input.skills.length >= 3 },
    { label: "Email verified", done: emailVerified },
  ];
  const done = items.filter((i) => i.done).length;
  return {
    percent: Math.round((done / items.length) * 100),
    items,
    missing: items.filter((i) => !i.done).map((i) => i.label),
  };
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
