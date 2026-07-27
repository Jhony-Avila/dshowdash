const VERSION = "1.1.0-P18EC";
const MODULE_ID = "toast-catalog";
const TOAST_EVENTS = Object.freeze({
  SHOWN: "toast:shown",
  DISMISSED: "toast:dismissed",
  DISMISSED_ALL: "toast:dismissed:all",
  READY: "toast:ready",
  QUEUE_UPDATED: "toast:queue:updated",
  ERROR: "toast:error",
  CLOSE_CLICKED: "toast:close:clicked",
  ACTION_CLICKED: "toast:action:clicked"
});
const TOAST_LISTENERS = Object.freeze({
  SHOW: "toast:show",
  DISMISS: "toast:dismiss",
  DISMISS_ALL: "toast:dismiss:all",
  APP_ERROR: "app:error",
  API_ERROR: "api:error",
  AUTH_ERROR: "auth:error",
  VALIDATION_ERROR: "validation:error"
});
const TOAST_TYPES = Object.freeze({
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
});
var toast_catalog_default = { TOAST_EVENTS, TOAST_LISTENERS, TOAST_TYPES, VERSION, MODULE_ID };
export {
  MODULE_ID,
  TOAST_EVENTS,
  TOAST_LISTENERS,
  TOAST_TYPES,
  VERSION,
  toast_catalog_default as default
};
