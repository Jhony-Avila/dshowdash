const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-error-boundary";
const ERROR_TYPES = {
  RENDER: "RENDER_ERROR",
  LIFECYCLE: "LIFECYCLE_ERROR",
  VALIDATION: "VALIDATION_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  NETWORK: "NETWORK_ERROR",
  PERMISSION: "PERMISSION_ERROR",
  STATE: "STATE_ERROR",
  UNKNOWN: "UNKNOWN_ERROR"
};
const SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};
const DEFAULT_CONFIG = {
  enabled: true,
  maxErrors: 100,
  errorTTL: 3e5,
  autoRecover: true,
  recoverAttempts: 3,
  recoverDelay: 1e3,
  fallbackContent: null,
  reportErrors: true,
  logToConsole: true
};
export {
  DEFAULT_CONFIG,
  ERROR_TYPES,
  MODULE_ID,
  SEVERITY,
  VERSION
};
