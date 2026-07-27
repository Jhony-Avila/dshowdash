const VERSION = "2.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.error-boundary.utils.helpers";
function formatError(error) {
  if (!error) {
    return {
      message: "Unknown error",
      stack: "",
      name: "Error",
      code: null,
      source: "unknown",
      severity: "error",
      timestamp: Date.now()
    };
  }
  return {
    message: error.message || String(error),
    stack: error.stack || "",
    name: error.name || "Error",
    code: error.code || error.statusCode || null,
    source: error.source || "unknown",
    severity: error.severity || (error.name === "TypeError" ? "critical" : "error"),
    route: error.route || null,
    panel: error.panel || null,
    timestamp: Date.now()
  };
}
function formatErrorForDisplay(error) {
  const formatted = formatError(error);
  return {
    title: formatted.name || "Application Error",
    message: formatted.message || "Something went wrong. Please try refreshing the page.",
    timestamp: (/* @__PURE__ */ new Date()).toLocaleString(),
    code: formatted.code,
    severity: formatted.severity,
    route: formatted.route,
    panel: formatted.panel,
    actionable: isRecoverable(error)
  };
}
function createErrorId() {
  return `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function isRecoverable(error) {
  const nonRecoverable = ["SyntaxError", "ReferenceError", "TypeError", "RangeError"];
  return !nonRecoverable.includes(error?.name);
}
function sanitizeError(error) {
  if (!error) return { message: "Unknown error", name: "Error", stack: null };
  const sanitized = {
    message: String(error.message || error).substring(0, 1e3),
    name: error.name || "Error",
    stack: error.stack ? String(error.stack).substring(0, 2e3) : null,
    code: error.code || error.statusCode || null,
    source: error.source || null
  };
  if (sanitized.message) {
    sanitized.message = sanitized.message.replace(/password[=:]\s*\S+/gi, "password=[REDACTED]");
    sanitized.message = sanitized.message.replace(/token[=:]\s*\S+/gi, "token=[REDACTED]");
    sanitized.message = sanitized.message.replace(/api[_-]?key[=:]\s*\S+/gi, "apikey=[REDACTED]");
  }
  return sanitized;
}
function categorizeError(error) {
  if (!error) return "unknown";
  const name = error.name || "";
  const message = (error.message || "").toLowerCase();
  if (name === "NetworkError" || message.includes("network") || message.includes("fetch")) return "network";
  if (name === "TypeError" || name === "ReferenceError") return "runtime";
  if (name === "SyntaxError") return "syntax";
  if (error.statusCode >= 400 && error.statusCode < 500) return "client";
  if (error.statusCode >= 500) return "server";
  if (message.includes("timeout")) return "timeout";
  if (message.includes("permission") || message.includes("unauthorized")) return "auth";
  return "general";
}
function shouldReportError(error, options = {}) {
  if (!error) return false;
  const ignoredMessages = options.ignoredMessages || ["ResizeObserver loop", "Script error", "Loading chunk"];
  const message = error.message || "";
  for (const ignored of ignoredMessages) {
    if (message.includes(ignored)) return false;
  }
  if (options.ignoredTypes && options.ignoredTypes.includes(error.name)) return false;
  return true;
}
function createErrorFingerprint(error) {
  if (!error) return "unknown";
  const parts = [error.name || "Error", (error.message || "").substring(0, 100)];
  if (error.stack) {
    const firstLine = error.stack.split("\n")[1] || "";
    const match = firstLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
    if (match) parts.push(match[1], match[2], match[3]);
  }
  return parts.join("|").replace(/\s+/g, "_").substring(0, 200);
}
function mergeContext(...contexts) {
  const result = {};
  for (const ctx of contexts) {
    if (ctx && typeof ctx === "object") Object.assign(result, ctx);
  }
  return result;
}
function safeExecute(fn, fallback = null) {
  try {
    if (typeof fn !== "function") return fallback;
    return fn();
  } catch {
    return fallback;
  }
}
const ErrorHelpers = {
  formatError,
  formatErrorForDisplay,
  createErrorId,
  isRecoverable,
  sanitizeError,
  categorizeError,
  shouldReportError,
  createErrorFingerprint,
  mergeContext,
  safeExecute,
  VERSION,
  MODULE_ID,
  healthCheck() {
    const checks = {
      functionsAvailable: typeof formatError === "function" && typeof sanitizeError === "function",
      versionValid: typeof VERSION === "string" && VERSION.length > 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : "DEGRADED",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: passed === total ? null : Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key),
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  },
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      functions: [
        "formatError",
        "formatErrorForDisplay",
        "createErrorId",
        "isRecoverable",
        "sanitizeError",
        "categorizeError",
        "shouldReportError",
        "createErrorFingerprint",
        "mergeContext",
        "safeExecute"
      ],
      healthCheck: this.healthCheck(),
      timestamp: Date.now()
    };
  }
};
function healthCheck() {
  return ErrorHelpers.healthCheck();
}
function info() {
  return ErrorHelpers.info();
}
var helpers_default = ErrorHelpers;
export {
  ErrorHelpers,
  MODULE_ID,
  VERSION,
  categorizeError,
  createErrorFingerprint,
  createErrorId,
  helpers_default as default,
  formatError,
  formatErrorForDisplay,
  healthCheck,
  info,
  isRecoverable,
  mergeContext,
  safeExecute,
  sanitizeError,
  shouldReportError
};
