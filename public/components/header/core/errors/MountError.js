import { BaseError } from "./BaseError.js";
const MODULE_ID = "header.core.errors.MountError";
const VERSION = "1.1.0-ES6";
function MountError(message, componentName, context) {
  BaseError.call(this, message, "MOUNT_ERROR", Object.assign({ componentName }, context));
  this.name = "MountError";
  this.componentName = componentName || "unknown";
}
MountError.prototype = Object.create(BaseError.prototype);
MountError.prototype.constructor = MountError;
MountError.containerNotFound = (componentName, selector) => new MountError(`Container n\xE3o encontrado: ${selector}`, componentName, { selector, reason: "CONTAINER_NOT_FOUND" });
MountError.classNotFound = (componentName, modulePath) => new MountError("Classe do componente n\xE3o encontrada", componentName, { modulePath, reason: "CLASS_NOT_FOUND" });
MountError.alreadyMounted = (componentName) => new MountError("Componente j\xE1 est\xE1 montado", componentName, { reason: "ALREADY_MOUNTED" });
MountError.circuitBreakerOpen = (componentName) => new MountError("Circuit breaker aberto - muitas falhas recentes", componentName, { reason: "CIRCUIT_BREAKER_OPEN" });
var MountError_default = MountError;
export {
  MODULE_ID,
  MountError,
  VERSION,
  MountError_default as default
};
