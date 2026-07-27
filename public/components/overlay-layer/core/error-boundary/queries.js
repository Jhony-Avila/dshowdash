import { errors, state } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.queries";
function getErrors(limit = 20) {
  return errors.slice(-limit).reverse();
}
function getErrorsByType(type) {
  return errors.filter((e) => e.type === type);
}
function getErrorsBySeverity(severity) {
  return errors.filter((e) => e.severity === severity);
}
function getUnrecoveredErrors() {
  return errors.filter((e) => !e.recovered);
}
function getLastError() {
  return state.lastError;
}
export {
  MODULE_ID,
  VERSION,
  getErrors,
  getErrorsBySeverity,
  getErrorsByType,
  getLastError,
  getUnrecoveredErrors
};
