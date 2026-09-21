import { z } from "zod";

/* ------------------------------ enums ------------------------------ */

export const SERVICE_TYPES = [
  "USER_FEEDBACK",
  "BUG_TESTING",
  "USABILITY_TESTING",
  "BETA_TESTING",
  "TARGETED_RESEARCH",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const PRODUCT_TYPES = [
  "WEBSITE",
  "WEB_APP",
  "MOBILE_APP",
  "DESKTOP_APP",
  "PROTOTYPE",
  "CONCEPT",
  "OTHER",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "QUOTED",
  "PAYMENT_PENDING",
  "PAID",
  "RECRUITING",
  "MATCHING",
  "ASSIGNING",
  "TESTING",
  "QUALITY_REVIEW",
  "REPLACEMENTS",
  "COMPLETED",
  "ANALYZING",
  "REPORT_READY",
  "CLOSED",
  "PAUSED",
  "CANCELLED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const REQUIREMENT_TYPES = [
  "COUNTRY",
  "AGE_RANGE",
  "EXPERIENCE",
  "SKILL",
  "DEVICE_PLATFORM",
  "PRIOR_EXPOSURE",
  "AVAILABILITY",
  "OTHER",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const REQUIREMENT_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "IN",
  "NOT_IN",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "CONTAINS",
  "BOOLEAN_IS",
] as const;
export type RequirementOperator = (typeof REQUIREMENT_OPERATORS)[number];

/* ------------------------------ rows ------------------------------ */

export interface CampaignRow {
  id: string;
  organization_id: string;
  created_by: string;
  service_type: ServiceType;
  name: string;
  objective: string | null;
  description: string | null;
  product_url: string | null;
  status: CampaignStatus;
  participant_target: number;
  deadline: string | null;
  product_name: string | null;
  product_type: ProductType | null;
  login_required: boolean;
  test_account_instructions: string | null;
  client_notes: string | null;
  cancellation_reason: string | null;
  submitted_at: string | null;
  quoted_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignRequirementRow {
  id: string;
  campaign_id: string;
  requirement_type: RequirementType;
  operator: RequirementOperator;
  value: unknown;
  required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignTaskRow {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  success_criteria: string | null;
  max_duration: number | null;
  sequence: number;
  required: boolean;
  created_at: string;
  updated_at: string;
}

export interface Completeness {
  complete: boolean;
  missing: string[];
}

export function completenessPercent(missing: string[]): number {
  if (missing.length === 0) return 100;
  return Math.max(0, Math.round(((10 - missing.length) / 10) * 100));
}

/* ------------------------------ labels ------------------------------ */

export const SERVICE_LABELS: Record<ServiceType, string> = {
  USER_FEEDBACK: "User feedback",
  BUG_TESTING: "Bug testing",
  USABILITY_TESTING: "Usability testing",
  BETA_TESTING: "Beta testing",
  TARGETED_RESEARCH: "Targeted research",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  WEBSITE: "Website",
  WEB_APP: "Web app",
  MOBILE_APP: "Mobile app",
  DESKTOP_APP: "Desktop app",
  PROTOTYPE: "Prototype",
  CONCEPT: "Concept",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  QUOTED: "Awaiting quote",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  RECRUITING: "Recruiting testers",
  MATCHING: "Matching",
  ASSIGNING: "Assigning",
  TESTING: "Testing",
  QUALITY_REVIEW: "Quality review",
  REPLACEMENTS: "Replacements",
  COMPLETED: "Completed",
  ANALYZING: "Analysing",
  REPORT_READY: "Report ready",
  CLOSED: "Closed",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
};

const URL_REQUIRED_TYPES: ProductType[] = ["WEBSITE", "WEB_APP"];

export function productUrlRequired(productType: ProductType | null): boolean {
  return productType != null && URL_REQUIRED_TYPES.includes(productType);
}

/* ------------------------------ schemas ------------------------------ */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const campaignDraftSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(140),
    serviceType: z.enum(SERVICE_TYPES),
    productType: z.enum(PRODUCT_TYPES),
    productName: z.string().trim().min(1, "Product name is required").max(120),
    productUrl: z
      .union([z.literal(""), z.string().trim().url("Enter a valid URL (https://…)")])
      .optional(),
    objective: z
      .string()
      .trim()
      .min(10, "Describe the objective in at least 10 characters")
      .max(600),
    description: optionalText(4000),
    participantTarget: z.coerce
      .number({ invalid_type_error: "Enter a number" })
      .int("Whole numbers only")
      .min(1, "At least 1 participant")
      .max(1000, "At most 1000 participants"),
    deadline: z.string().trim().min(1, "A deadline is required"),
    loginRequired: z.boolean(),
    testAccountInstructions: optionalText(2000),
    clientNotes: optionalText(2000),
  })
  .superRefine((values, ctx) => {
    if (productUrlRequired(values.productType) && !values.productUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productUrl"],
        message: "A product URL is required for websites and web apps",
      });
    }
    if (values.loginRequired && !values.testAccountInstructions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["testAccountInstructions"],
        message: "Describe how testers should sign in",
      });
    }
  });

export type CampaignFormValues = z.infer<typeof campaignDraftSchema>;

export const campaignTaskSchema = z.object({
  title: z.string().trim().min(3, "Task title must be at least 3 characters").max(140),
  description: optionalText(2000),
  instructions: optionalText(4000),
  successCriteria: optionalText(1000),
  maxDuration: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z
      .number()
      .int("Whole minutes only")
      .min(1, "At least 1 minute")
      .max(600, "At most 600 minutes")
      .nullable(),
  ),
  required: z.boolean(),
});
export type CampaignTaskInput = z.infer<typeof campaignTaskSchema>;

export const campaignRequirementSchema = z.object({
  requirementType: z.enum(REQUIREMENT_TYPES),
  operator: z.enum(REQUIREMENT_OPERATORS),
  value: z.string().trim().min(1, "A value is required").max(300),
  required: z.boolean(),
});
export type CampaignRequirementInput = z.infer<typeof campaignRequirementSchema>;

/** Convert the single form value into the JSONB shape stored per operator. */
export function requirementValueToJson(operator: RequirementOperator, value: string): unknown {
  if (operator === "IN" || operator === "NOT_IN") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  if (operator === "BOOLEAN_IS") return value.trim().toLowerCase() === "true";
  if (
    operator === "GREATER_THAN" ||
    operator === "GREATER_THAN_OR_EQUAL" ||
    operator === "LESS_THAN" ||
    operator === "LESS_THAN_OR_EQUAL"
  ) {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

export function formatRequirementValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export const OPERATOR_LABELS: Record<RequirementOperator, string> = {
  EQUALS: "is equal to",
  NOT_EQUALS: "is not equal to",
  IN: "is any of (comma separated)",
  NOT_IN: "is none of (comma separated)",
  GREATER_THAN: "is greater than",
  GREATER_THAN_OR_EQUAL: "is at least",
  LESS_THAN: "is less than",
  LESS_THAN_OR_EQUAL: "is at most",
  CONTAINS: "contains",
  BOOLEAN_IS: "is true/false",
};

/* --------------------------- completeness mirror --------------------------- */

export interface CompletenessInput {
  name: string | null;
  serviceType: ServiceType | null;
  objective: string | null;
  productName: string | null;
  productType: ProductType | null;
  productUrl: string | null;
  loginRequired: boolean;
  testAccountInstructions: string | null;
  participantTarget: number | null;
  deadline: string | null;
}

/** Mirrors the database function `campaign_core_completeness`. */
export function calculateCoreCompleteness(
  c: CompletenessInput | null,
  taskCount: number,
): Completeness {
  const missing: string[] = [];
  if (!c) return { complete: false, missing: ["campaign"] };
  if (!c.name || c.name.trim() === "") missing.push("name");
  if (c.serviceType == null) missing.push("service type");
  if (!c.objective || c.objective.trim() === "") missing.push("objective");
  if (!c.productName || c.productName.trim() === "") missing.push("product name");
  if (c.productType == null) missing.push("product type");
  if (productUrlRequired(c.productType) && (!c.productUrl || c.productUrl.trim() === ""))
    missing.push("product URL");
  if (c.loginRequired && (!c.testAccountInstructions || c.testAccountInstructions.trim() === ""))
    missing.push("test account instructions");
  if (c.participantTarget == null || c.participantTarget < 1) missing.push("participant target");
  if (!c.deadline) missing.push("deadline");
  if (taskCount === 0) missing.push("tasks");
  return { complete: missing.length === 0, missing };
}

/* ------------------------------ lifecycle ------------------------------ */

export interface ClientActions {
  canEdit: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
  canCancel: boolean;
  canDelete: boolean;
}

export function clientActionsFor(status: CampaignStatus): ClientActions {
  return {
    canEdit: status === "DRAFT",
    canSubmit: status === "DRAFT",
    canWithdraw: status === "QUOTED" || status === "PAYMENT_PENDING",
    canCancel: !["CANCELLED", "CLOSED", "COMPLETED"].includes(status),
    canDelete: status === "DRAFT",
  };
}

const ADMIN_TRANSITIONS: Partial<Record<CampaignStatus, CampaignStatus[]>> = {
  DRAFT: ["CANCELLED"],
  QUOTED: ["PAYMENT_PENDING", "DRAFT", "CANCELLED", "PAUSED"],
  PAYMENT_PENDING: ["PAID", "QUOTED", "CANCELLED", "PAUSED"],
  PAID: ["CANCELLED", "PAUSED"],
  PAUSED: ["QUOTED", "PAYMENT_PENDING", "PAID", "CANCELLED"],
};

export function adminTransitionsFor(status: CampaignStatus): CampaignStatus[] {
  return ADMIN_TRANSITIONS[status] ?? [];
}

export const ADMIN_STATUS_OPTIONS = CAMPAIGN_STATUSES.filter((s) => s !== "DRAFT" || true);
