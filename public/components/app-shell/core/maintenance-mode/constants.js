const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-maintenance-mode";
const STORAGE_KEY = "app-shell-maintenance-state";
const MAINTENANCE_TYPES = Object.freeze({
  FULL: "full",
  PARTIAL: "partial",
  SCHEDULED: "scheduled",
  EMERGENCY: "emergency",
  FEATURE: "feature"
});
const SEVERITY = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical"
});
export {
  MAINTENANCE_TYPES,
  MODULE_ID,
  SEVERITY,
  STORAGE_KEY,
  VERSION
};
