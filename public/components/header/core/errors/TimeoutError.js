import { BaseError } from "./BaseError.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header.core.errors.TimeoutError";
function TimeoutError(message, operation, timeoutMs, context) {
  BaseError.call(this, message, "TIMEOUT_ERROR", Object.assign({ operation, timeoutMs }, context));
  this.name = "TimeoutError";
  this.operation = operation || "unknown";
  this.timeoutMs = timeoutMs || 0;
}
TimeoutError.prototype = Object.create(BaseError.prototype);
TimeoutError.prototype.constructor = TimeoutError;
TimeoutError.mount = (componentName, timeoutMs) => new TimeoutError(`Timeout ao montar componente: ${componentName}`, "mount", timeoutMs, { componentName });
TimeoutError.api = (endpoint, timeoutMs) => new TimeoutError(`Timeout na requisi\xE7\xE3o: ${endpoint}`, "api", timeoutMs, { endpoint });
TimeoutError.healthCheck = (componentName, timeoutMs) => new TimeoutError(`Timeout no health check: ${componentName}`, "healthCheck", timeoutMs, { componentName });
var TimeoutError_default = TimeoutError;
export {
  MODULE_ID,
  TimeoutError,
  VERSION,
  TimeoutError_default as default
};
