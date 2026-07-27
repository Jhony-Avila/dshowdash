import { ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.error-handler.classifier";
function classifyCategory(error, context = {}) {
  if (context.category) return context.category;
  const message = (error.message || "").toLowerCase();
  const name = (error.name || "").toLowerCase();
  if (message.includes("network") || message.includes("fetch") || message.includes("xhr") || name === "networkerror") {
    return ERROR_CATEGORIES.NETWORK;
  }
  if (message.includes("timeout") || message.includes("abort")) {
    return ERROR_CATEGORIES.NETWORK;
  }
  if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  if (message.includes("security") || message.includes("permission") || message.includes("forbidden") || message.includes("unauthorized")) {
    return ERROR_CATEGORIES.SECURITY;
  }
  if (message.includes("memory") || message.includes("resource") || message.includes("quota")) {
    return ERROR_CATEGORIES.RESOURCE;
  }
  if (message.includes("mount") || message.includes("unmount") || message.includes("init") || message.includes("destroy")) {
    return ERROR_CATEGORIES.LIFECYCLE;
  }
  if (message.includes("render") || message.includes("dom") || message.includes("element")) {
    return ERROR_CATEGORIES.RENDER;
  }
  if (message.includes("state") || message.includes("store") || message.includes("reducer")) {
    return ERROR_CATEGORIES.STATE;
  }
  return ERROR_CATEGORIES.UNKNOWN;
}
function classifySeverity(error, context = {}) {
  if (context.severity) return context.severity;
  const message = (error.message || "").toLowerCase();
  const category = classifyCategory(error, context);
  if (message.includes("out of memory") || message.includes("stack overflow") || message.includes("fatal")) {
    return ERROR_SEVERITY.CRITICAL;
  }
  if (category === ERROR_CATEGORIES.SECURITY) {
    return ERROR_SEVERITY.HIGH;
  }
  if (message.includes("crash") || message.includes("unrecoverable")) {
    return ERROR_SEVERITY.HIGH;
  }
  if (category === ERROR_CATEGORIES.LIFECYCLE || category === ERROR_CATEGORIES.STATE) {
    return ERROR_SEVERITY.HIGH;
  }
  if (message.includes("warning") || category === ERROR_CATEGORIES.VALIDATION) {
    return ERROR_SEVERITY.LOW;
  }
  if (message.includes("undefined") || message.includes("null")) {
    return ERROR_SEVERITY.LOW;
  }
  return ERROR_SEVERITY.MEDIUM;
}
function suggestRecovery(error, context = {}) {
  const category = classifyCategory(error, context);
  const severity = classifySeverity(error, context);
  if (severity === ERROR_SEVERITY.CRITICAL) {
    return RECOVERY_ACTIONS.RESET;
  }
  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
      return RECOVERY_ACTIONS.RETRY;
    case ERROR_CATEGORIES.VALIDATION:
      return RECOVERY_ACTIONS.IGNORE;
    case ERROR_CATEGORIES.RESOURCE:
      return RECOVERY_ACTIONS.FALLBACK;
    case ERROR_CATEGORIES.LIFECYCLE:
      return RECOVERY_ACTIONS.RESET;
    default:
      return severity === ERROR_SEVERITY.LOW ? RECOVERY_ACTIONS.IGNORE : RECOVERY_ACTIONS.FALLBACK;
  }
}
var classifier_default = { classifyCategory, classifySeverity, suggestRecovery };
export {
  MODULE_ID,
  VERSION,
  classifyCategory,
  classifySeverity,
  classifier_default as default,
  suggestRecovery
};
