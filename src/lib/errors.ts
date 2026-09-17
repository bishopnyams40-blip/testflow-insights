/**
 * Consistent application error taxonomy.
 * Internal details (stack traces, SQL, secrets) never reach the user-facing message.
 */
export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "BUSINESS_RULE_VIOLATION",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const SAFE_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Some of the information provided isn't valid.",
  UNAUTHORIZED: "You need to sign in to continue.",
  FORBIDDEN: "You don't have access to this.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  CONFLICT: "That action conflicts with existing data.",
  BUSINESS_RULE_VIOLATION: "That action isn't allowed by TestFlow's rules.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again.",
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? SAFE_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }

  toClient() {
    return { code: this.code, message: this.message };
  }
}

/** Map any thrown value to a safe, user-presentable error payload. */
export function toSafeError(error: unknown): { code: ErrorCode; message: string } {
  if (error instanceof AppError) return error.toClient();

  const raw = error instanceof Error ? error.message : "";

  // Supabase/Postgres signals mapped to the taxonomy without leaking internals.
  if (/row-level security|not authorized|permission denied/i.test(raw)) {
    return { code: "FORBIDDEN", message: SAFE_MESSAGES.FORBIDDEN };
  }
  if (/duplicate key|unique constraint|already registered/i.test(raw)) {
    return { code: "CONFLICT", message: SAFE_MESSAGES.CONFLICT };
  }
  if (/invalid login credentials/i.test(raw)) {
    return { code: "UNAUTHORIZED", message: "Email or password is incorrect." };
  }
  if (/email not confirmed/i.test(raw)) {
    return { code: "UNAUTHORIZED", message: "Please confirm your email address first." };
  }
  if (/Testers cannot participate/i.test(raw)) {
    return {
      code: "BUSINESS_RULE_VIOLATION",
      message: "Testers can't be added to client conversations.",
    };
  }
  return { code: "INTERNAL_ERROR", message: SAFE_MESSAGES.INTERNAL_ERROR };
}
