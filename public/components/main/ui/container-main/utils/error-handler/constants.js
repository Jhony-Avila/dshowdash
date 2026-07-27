const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:error-handler";
const ERROR_SEVERITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
});
const ERROR_CATEGORIES = Object.freeze({
  NETWORK: "network",
  VALIDATION: "validation",
  SECURITY: "security",
  RESOURCE: "resource",
  LIFECYCLE: "lifecycle",
  RENDER: "render",
  STATE: "state",
  UNKNOWN: "unknown"
});
const RECOVERY_ACTIONS = Object.freeze({
  RETRY: "retry",
  FALLBACK: "fallback",
  IGNORE: "ignore",
  PROPAGATE: "propagate",
  RESET: "reset"
});
const MAX_ERROR_LOG = 200;
var constants_default = {
  VERSION,
  MODULE_ID,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  RECOVERY_ACTIONS,
  MAX_ERROR_LOG
};
export {
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  MAX_ERROR_LOG,
  MODULE_ID,
  RECOVERY_ACTIONS,
  VERSION,
  constants_default as default
};
