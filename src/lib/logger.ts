/**
 * Structured application logging.
 * Never log passwords, tokens or any authentication secret.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  module?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = /pass(word)?|token|secret|authorization|apikey|api_key|cookie/i;

function redact(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      REDACTED_KEYS.test(key) ? "[redacted]" : value,
    ]),
  );
}

function emit(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context.requestId,
    userId: context.userId,
    organizationId: context.organizationId,
    module: context.module,
    action: context.action,
    metadata: redact(context.metadata),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
};
