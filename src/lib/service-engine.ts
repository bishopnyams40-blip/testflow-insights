/**
 * TestFlow Service Engine.
 *
 * One Campaign model + one Campaign Engine + five service configurations.
 * This module is the single place where per-service behaviour is defined:
 * fields, validation, evidence expectations, pricing inputs, report structure
 * and workflow flags. Nothing here creates a second lifecycle: campaign status
 * and service type remain separate concepts.
 */

import type { ProductType, RequirementType, ServiceType } from "./campaign";
import { SERVICE_TYPES } from "./campaign";

/* ------------------------------ primitives ------------------------------ */

export const EVIDENCE_TYPES = [
  "TEXT",
  "SCREENSHOT",
  "SCREEN_RECORDING",
  "VIDEO",
  "AUDIO",
  "TRANSCRIPT",
  "METRIC",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type EvidenceExpectation = "REQUIRED" | "RECOMMENDED" | "OPTIONAL";

export const EVIDENCE_LABELS: Record<EvidenceType, string> = {
  TEXT: "Written feedback",
  SCREENSHOT: "Screenshots",
  SCREEN_RECORDING: "Screen recordings",
  VIDEO: "Video",
  AUDIO: "Audio",
  TRANSCRIPT: "Transcript",
  METRIC: "Metrics",
};

export type ServiceConfigValue = string | number | boolean | string[];
export type ServiceConfig = Record<string, ServiceConfigValue>;

export type FieldKind = "text" | "textarea" | "number" | "list" | "select" | "date";

export interface ServiceFieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface TaskRules {
  /** How tasks are presented for this service. */
  label: string;
  minTasks: number;
  requireSuccessCriteria: boolean;
  suggestDuration: boolean;
}

export interface WorkflowFlags {
  ongoingParticipation: boolean;
  structuredBugEvidence: boolean;
  screeningRequired: boolean;
  sessionTimed: boolean;
  qualitativeSynthesis: boolean;
}

export interface ServiceDefinition {
  serviceType: ServiceType;
  displayName: string;
  shortDescription: string;
  objectivePrompt: string;
  supportedProductTypes: ProductType[];
  fields: ServiceFieldSpec[];
  requirementTypes: RequirementType[];
  evidenceTypes: Partial<Record<EvidenceType, EvidenceExpectation>>;
  taskRules: TaskRules;
  validationRules: string[];
  pricingInputKeys: string[];
  reportSectionKeys: string[];
  workflowFlags: WorkflowFlags;
}

/* ------------------------------ shared fields ------------------------------ */

const EVIDENCE_LEVEL_FIELD: ServiceFieldSpec = {
  key: "evidenceLevel",
  label: "Evidence level",
  kind: "select",
  required: true,
  help: "How much proof testers should capture alongside their notes.",
  options: [
    { value: "BASIC", label: "Written notes only" },
    { value: "STANDARD", label: "Notes plus screenshots" },
    { value: "RICH", label: "Notes, screenshots and recordings" },
  ],
};

const URGENCY_FIELD: ServiceFieldSpec = {
  key: "urgency",
  label: "Turnaround",
  kind: "select",
  required: true,
  options: [
    { value: "STANDARD", label: "Standard" },
    { value: "PRIORITY", label: "Priority" },
    { value: "URGENT", label: "Urgent" },
  ],
};

const SHARED_FIELDS: ServiceFieldSpec[] = [EVIDENCE_LEVEL_FIELD, URGENCY_FIELD];

const ALL_PRODUCT_TYPES: ProductType[] = [
  "WEBSITE",
  "WEB_APP",
  "MOBILE_APP",
  "DESKTOP_APP",
  "PROTOTYPE",
  "CONCEPT",
  "OTHER",
];

const COMMON_REPORT_SECTIONS = [
  "EXECUTIVE_SUMMARY",
  "METHODOLOGY",
  "PARTICIPANTS",
  "FINDINGS",
  "EVIDENCE",
  "RECOMMENDATIONS",
];

const COMMON_PRICING_INPUTS = ["participant_count", "evidence_level", "urgency"];

/* ------------------------------ definitions ------------------------------ */

const USER_FEEDBACK: ServiceDefinition = {
  serviceType: "USER_FEEDBACK",
  displayName: "User Feedback",
  shortDescription: "Find out what users think.",
  objectivePrompt: "What do you want to learn from real users about this product?",
  supportedProductTypes: ALL_PRODUCT_TYPES,
  fields: [
    {
      key: "targetAudience",
      label: "Who should give feedback",
      kind: "textarea",
      required: true,
      placeholder: "First-time online shoppers in Kenya who buy on mobile",
    },
    {
      key: "feedbackQuestions",
      label: "Questions to ask",
      kind: "list",
      required: true,
      help: "One question per line.",
    },
    { key: "priorExposure", label: "Prior exposure to the product", kind: "text", required: false },
    ...SHARED_FIELDS,
  ],
  requirementTypes: ["COUNTRY", "AGE_RANGE", "EXPERIENCE", "DEVICE_PLATFORM", "PRIOR_EXPOSURE"],
  evidenceTypes: { TEXT: "REQUIRED", SCREENSHOT: "OPTIONAL", SCREEN_RECORDING: "OPTIONAL" },
  taskRules: {
    label: "Questions and prompts testers respond to",
    minTasks: 1,
    requireSuccessCriteria: false,
    suggestDuration: false,
  },
  validationRules: ["Target audience is described", "At least one feedback question"],
  pricingInputKeys: [
    ...COMMON_PRICING_INPUTS,
    "targeting_complexity",
    "task_complexity",
    "question_count",
  ],
  reportSectionKeys: [...COMMON_REPORT_SECTIONS, "SENTIMENT_THEMES", "PARTICIPANT_FEEDBACK"],
  workflowFlags: {
    ongoingParticipation: false,
    structuredBugEvidence: false,
    screeningRequired: false,
    sessionTimed: false,
    qualitativeSynthesis: true,
  },
};

const BUG_TESTING: ServiceDefinition = {
  serviceType: "BUG_TESTING",
  displayName: "Bug Testing",
  shortDescription: "Find what's broken.",
  objectivePrompt: "Which parts of the product should we try hardest to break?",
  supportedProductTypes: ALL_PRODUCT_TYPES,
  fields: [
    {
      key: "testingScope",
      label: "Testing scope",
      kind: "textarea",
      required: true,
      placeholder: "Sign-up, checkout and payment confirmation",
    },
    { key: "focusAreas", label: "Areas or features to test", kind: "list", required: true },
    {
      key: "environments",
      label: "Environments to cover",
      kind: "list",
      required: true,
      help: "For example: iPhone Safari, Android Chrome, Windows Edge.",
    },
    { key: "knownIssues", label: "Known issues to ignore", kind: "textarea", required: false },
    ...SHARED_FIELDS,
  ],
  requirementTypes: ["DEVICE_PLATFORM", "COUNTRY", "EXPERIENCE", "SKILL"],
  evidenceTypes: {
    TEXT: "REQUIRED",
    SCREENSHOT: "RECOMMENDED",
    SCREEN_RECORDING: "RECOMMENDED",
    METRIC: "OPTIONAL",
  },
  taskRules: {
    label: "Test scenarios testers should run",
    minTasks: 1,
    requireSuccessCriteria: false,
    suggestDuration: true,
  },
  validationRules: [
    "Testing scope is described",
    "At least one focus area",
    "At least one environment",
  ],
  pricingInputKeys: [
    ...COMMON_PRICING_INPUTS,
    "testing_scope",
    "platform_count",
    "complexity",
    "task_count",
  ],
  reportSectionKeys: [
    ...COMMON_REPORT_SECTIONS,
    "VERIFIED_BUGS",
    "SEVERITY_BREAKDOWN",
    "REPRODUCTION_DETAIL",
    "ENVIRONMENT_COVERAGE",
  ],
  workflowFlags: {
    ongoingParticipation: false,
    structuredBugEvidence: true,
    screeningRequired: false,
    sessionTimed: false,
    qualitativeSynthesis: false,
  },
};

const USABILITY_TESTING: ServiceDefinition = {
  serviceType: "USABILITY_TESTING",
  displayName: "Usability Testing",
  shortDescription: "See where users struggle.",
  objectivePrompt: "Which journey should participants attempt, and what counts as success?",
  supportedProductTypes: ALL_PRODUCT_TYPES,
  fields: [
    {
      key: "sessionDurationMinutes",
      label: "Session length in minutes",
      kind: "number",
      required: true,
    },
    { key: "targetUsers", label: "Who the tasks are aimed at", kind: "textarea", required: false },
    {
      key: "observationFocus",
      label: "What to watch for",
      kind: "list",
      required: false,
      help: "For example: hesitation, confusion, abandonment.",
    },
    ...SHARED_FIELDS,
  ],
  requirementTypes: ["COUNTRY", "AGE_RANGE", "EXPERIENCE", "DEVICE_PLATFORM", "PRIOR_EXPOSURE"],
  evidenceTypes: {
    TEXT: "REQUIRED",
    SCREEN_RECORDING: "RECOMMENDED",
    SCREENSHOT: "OPTIONAL",
    AUDIO: "OPTIONAL",
  },
  taskRules: {
    label: "Tasks participants attempt (each needs success criteria)",
    minTasks: 1,
    requireSuccessCriteria: true,
    suggestDuration: true,
  },
  validationRules: ["Session length is set", "Every task has success criteria"],
  pricingInputKeys: [
    ...COMMON_PRICING_INPUTS,
    "task_count",
    "task_complexity",
    "session_duration",
    "targeting_complexity",
  ],
  reportSectionKeys: [
    ...COMMON_REPORT_SECTIONS,
    "TASK_OUTCOMES",
    "USABILITY_OBSERVATIONS",
    "FRICTION_POINTS",
  ],
  workflowFlags: {
    ongoingParticipation: false,
    structuredBugEvidence: false,
    screeningRequired: false,
    sessionTimed: true,
    qualitativeSynthesis: true,
  },
};

const BETA_TESTING: ServiceDefinition = {
  serviceType: "BETA_TESTING",
  displayName: "Beta Testing",
  shortDescription: "See what happens over time.",
  objectivePrompt: "How should participants use the product during the testing period?",
  supportedProductTypes: ALL_PRODUCT_TYPES,
  fields: [
    { key: "testingDurationDays", label: "Testing period in days", kind: "number", required: true },
    { key: "startDate", label: "Start date", kind: "date", required: true },
    { key: "endDate", label: "End date", kind: "date", required: true },
    {
      key: "usageExpectations",
      label: "What participants should do",
      kind: "textarea",
      required: true,
      placeholder: "Use the app at least three times a week and report anything odd",
    },
    { key: "supportedPlatforms", label: "Supported platforms", kind: "list", required: false },
    ...SHARED_FIELDS,
  ],
  requirementTypes: ["COUNTRY", "DEVICE_PLATFORM", "EXPERIENCE", "AVAILABILITY"],
  evidenceTypes: { TEXT: "REQUIRED", SCREENSHOT: "OPTIONAL", SCREEN_RECORDING: "OPTIONAL" },
  taskRules: {
    label: "Activities participants carry out during the period",
    minTasks: 1,
    requireSuccessCriteria: false,
    suggestDuration: false,
  },
  validationRules: [
    "Testing period is set",
    "Start and end dates are set",
    "Usage expectations are described",
  ],
  pricingInputKeys: [
    ...COMMON_PRICING_INPUTS,
    "testing_duration",
    "engagement_requirements",
    "targeting_complexity",
  ],
  reportSectionKeys: [
    ...COMMON_REPORT_SECTIONS,
    "USAGE_OBSERVATIONS",
    "RECURRING_ISSUES",
    "ENGAGEMENT_OBSERVATIONS",
  ],
  workflowFlags: {
    ongoingParticipation: true,
    structuredBugEvidence: false,
    screeningRequired: false,
    sessionTimed: false,
    qualitativeSynthesis: true,
  },
};

const TARGETED_RESEARCH: ServiceDefinition = {
  serviceType: "TARGETED_RESEARCH",
  displayName: "Targeted Research",
  shortDescription: "Ask specific people specific questions.",
  objectivePrompt: "What do you need to know, and who exactly must answer it?",
  supportedProductTypes: ALL_PRODUCT_TYPES,
  fields: [
    { key: "researchQuestions", label: "Research questions", kind: "list", required: true },
    {
      key: "screeningRequirements",
      label: "Screening requirements",
      kind: "list",
      required: true,
      help: "Who qualifies to answer. One per line.",
    },
    {
      key: "responseFormat",
      label: "Response format",
      kind: "select",
      required: true,
      options: [
        { value: "SHORT_ANSWER", label: "Short written answers" },
        { value: "LONG_FORM", label: "Long-form written answers" },
        { value: "STRUCTURED", label: "Structured answers" },
      ],
    },
    { key: "targetAudience", label: "Target audience", kind: "textarea", required: false },
    ...SHARED_FIELDS,
  ],
  requirementTypes: [
    "COUNTRY",
    "AGE_RANGE",
    "EXPERIENCE",
    "SKILL",
    "DEVICE_PLATFORM",
    "PRIOR_EXPOSURE",
    "OTHER",
  ],
  evidenceTypes: { TEXT: "REQUIRED", SCREENSHOT: "OPTIONAL", TRANSCRIPT: "OPTIONAL" },
  taskRules: {
    label: "Research questions and prompts",
    minTasks: 1,
    requireSuccessCriteria: false,
    suggestDuration: false,
  },
  validationRules: [
    "At least one research question",
    "At least one screening requirement",
    "Response format selected",
  ],
  pricingInputKeys: [
    ...COMMON_PRICING_INPUTS,
    "targeting_difficulty",
    "screening_complexity",
    "question_complexity",
  ],
  reportSectionKeys: [
    ...COMMON_REPORT_SECTIONS,
    "RESEARCH_FINDINGS",
    "PARTICIPANT_RESPONSES",
    "THEMES",
  ],
  workflowFlags: {
    ongoingParticipation: false,
    structuredBugEvidence: false,
    screeningRequired: true,
    sessionTimed: false,
    qualitativeSynthesis: true,
  },
};

export const SERVICE_DEFINITIONS: Record<ServiceType, ServiceDefinition> = {
  USER_FEEDBACK,
  BUG_TESTING,
  USABILITY_TESTING,
  BETA_TESTING,
  TARGETED_RESEARCH,
};

/* ------------------------------ service API ------------------------------ */

export function getDefinition(serviceType: ServiceType): ServiceDefinition {
  return SERVICE_DEFINITIONS[serviceType];
}

export function listServices(): ServiceDefinition[] {
  return SERVICE_TYPES.map((s) => SERVICE_DEFINITIONS[s]);
}

export function getRequiredFields(serviceType: ServiceType): ServiceFieldSpec[] {
  return getDefinition(serviceType).fields.filter((f) => f.required);
}

export function getEvidenceRequirements(
  serviceType: ServiceType,
): Partial<Record<EvidenceType, EvidenceExpectation>> {
  return getDefinition(serviceType).evidenceTypes;
}

export function getReportSections(serviceType: ServiceType): string[] {
  return getDefinition(serviceType).reportSectionKeys;
}

export function getWorkflowFlags(serviceType: ServiceType): WorkflowFlags {
  return getDefinition(serviceType).workflowFlags;
}

/* ------------------------------ validation ------------------------------ */

export interface ServiceValidationContext {
  taskCount: number;
  tasksMissingSuccessCriteria: number;
}

export interface ServiceCompleteness {
  complete: boolean;
  missing: string[];
}

function hasText(value: ServiceConfigValue | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasList(value: ServiceConfigValue | undefined): boolean {
  return Array.isArray(value) && value.some((v) => String(v).trim().length > 0);
}

function isPositiveNumber(value: ServiceConfigValue | undefined): boolean {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0;
}

/**
 * Mirrors the database function `campaign_service_completeness`.
 * The database remains the authority; this is for immediate UI feedback.
 */
export function validateServiceConfiguration(
  serviceType: ServiceType,
  config: ServiceConfig | null | undefined,
  context: ServiceValidationContext = { taskCount: 0, tasksMissingSuccessCriteria: 0 },
): ServiceCompleteness {
  const cfg = config ?? {};
  const definition = getDefinition(serviceType);
  const missing: string[] = [];

  for (const field of definition.fields) {
    if (!field.required) continue;
    const value = cfg[field.key];
    const ok =
      field.kind === "list"
        ? hasList(value)
        : field.kind === "number"
          ? isPositiveNumber(value)
          : hasText(value);
    if (!ok) missing.push(field.key);
  }

  if (definition.taskRules.requireSuccessCriteria) {
    if (context.taskCount === 0 || context.tasksMissingSuccessCriteria > 0) {
      missing.push("taskSuccessCriteria");
    }
  }

  return { complete: missing.length === 0, missing };
}

export function fieldLabel(serviceType: ServiceType, key: string): string {
  const field = getDefinition(serviceType).fields.find((f) => f.key === key);
  if (field) return field.label;
  if (key === "taskSuccessCriteria") return "Success criteria on every task";
  return key;
}

/* ------------------------------ pricing inputs ------------------------------ */

export interface PricingInputSource {
  serviceType: ServiceType;
  participantTarget: number;
  taskCount: number;
  requirementCount: number;
  config: ServiceConfig | null | undefined;
}

/**
 * Machine-readable inputs for the future Pricing Engine.
 * No amounts, rates or currency are produced here.
 */
export function getPricingInputs(source: PricingInputSource): Record<string, ServiceConfigValue> {
  const cfg = source.config ?? {};
  const definition = getDefinition(source.serviceType);
  const values: Record<string, ServiceConfigValue> = {};

  for (const key of definition.pricingInputKeys) {
    switch (key) {
      case "participant_count":
        values[key] = source.participantTarget;
        break;
      case "evidence_level":
        values[key] = hasText(cfg["evidenceLevel"]) ? (cfg["evidenceLevel"] as string) : "UNSET";
        break;
      case "urgency":
        values[key] = hasText(cfg["urgency"]) ? (cfg["urgency"] as string) : "UNSET";
        break;
      case "task_count":
      case "question_count":
        values[key] = source.taskCount;
        break;
      case "task_complexity":
      case "complexity":
      case "question_complexity":
        values[key] = source.taskCount;
        break;
      case "targeting_complexity":
      case "targeting_difficulty":
        values[key] = source.requirementCount;
        break;
      case "screening_complexity":
        values[key] = Array.isArray(cfg["screeningRequirements"])
          ? (cfg["screeningRequirements"] as string[]).length
          : 0;
        break;
      case "platform_count":
        values[key] = Array.isArray(cfg["environments"])
          ? (cfg["environments"] as string[]).length
          : 0;
        break;
      case "testing_scope":
        values[key] = Array.isArray(cfg["focusAreas"]) ? (cfg["focusAreas"] as string[]).length : 0;
        break;
      case "session_duration":
        values[key] = Number(cfg["sessionDurationMinutes"] ?? 0);
        break;
      case "testing_duration":
        values[key] = Number(cfg["testingDurationDays"] ?? 0);
        break;
      case "engagement_requirements":
        values[key] = hasText(cfg["usageExpectations"]);
        break;
      default:
        values[key] = "UNSET";
    }
  }

  return values;
}

/* ------------------------------ config helpers ------------------------------ */

/** Normalises raw JSON from the database into a typed service configuration. */
export function toServiceConfig(raw: unknown): ServiceConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ServiceConfig = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value.map((v) => String(v));
    }
  }
  return out;
}

/** Drops keys that do not belong to the selected service. */
export function pruneServiceConfig(serviceType: ServiceType, config: ServiceConfig): ServiceConfig {
  const keys = new Set(getDefinition(serviceType).fields.map((f) => f.key));
  const out: ServiceConfig = {};
  for (const [key, value] of Object.entries(config)) {
    if (keys.has(key)) out[key] = value;
  }
  return out;
}

export function emptyServiceConfig(serviceType: ServiceType): ServiceConfig {
  const out: ServiceConfig = {};
  for (const field of getDefinition(serviceType).fields) {
    if (field.kind === "list") out[field.key] = [];
    else if (field.kind === "number") out[field.key] = "" as unknown as number;
    else if (field.kind === "select") out[field.key] = field.options?.[0]?.value ?? "";
    else out[field.key] = "";
  }
  return out;
}

export function formatConfigValue(value: ServiceConfigValue | undefined): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(" · ") : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
