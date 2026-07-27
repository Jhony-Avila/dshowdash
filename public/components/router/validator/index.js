import { createCorePorts } from "/core/runtime/ports-profiles.js";
import * as RouterValidation from "./router-validation.js";
const MODULE_ID = "router.validator.index";
const VERSION = "1.2.0-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function healthCheck() {
  const hasValidation = typeof RouterValidation.runValidation === "function";
  return { status: hasValidation ? "HEALTHY" : "DEGRADED", module: MODULE_ID, version: VERSION, hasValidation, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), exports: Object.keys(RouterValidation), healthCheck: healthCheck(), timestamp: Date.now() };
}
if (typeof window !== "undefined") {
  window.RouterValidation = { ...RouterValidation, validate: RouterValidation.runValidation, validateRoute: RouterValidation.validateNavigationRequest, validateRegistry: RouterValidation.validateRoutesRegistry, healthCheck, info };
}
export * from "./router-validation.js";
var validator_default = { ...RouterValidation, MODULE_ID, VERSION, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  validator_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
