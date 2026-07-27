const VERSION = "2.0.0-PHASE4";
const MODULE_ID = "container-main:adapters";
export * from "./global-state-adapter.js";
import { default as default2 } from "./global-state-adapter.js";
export * from "./event-bus-adapter.js";
import { default as default3 } from "./event-bus-adapter.js";
const ADAPTERS = Object.freeze([
  "global-state-adapter",
  "event-bus-adapter"
]);
import { healthCheck as globalStateHealth } from "./global-state-adapter.js";
import { healthCheck as eventBusHealth } from "./event-bus-adapter.js";
function adaptersHealthCheck() {
  return {
    globalState: globalStateHealth(),
    eventBus: eventBusHealth()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    adapters: ADAPTERS
  };
}
function healthCheck() {
  const checks = adaptersHealthCheck();
  const allHealthy = Object.values(checks).every((c) => c.status === "HEALTHY" || c.status === "NOT_INITIALIZED");
  return {
    status: allHealthy ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    adapters: checks
  };
}
var adapters_default = { VERSION, MODULE_ID, ADAPTERS, adaptersHealthCheck, info, healthCheck };
export {
  ADAPTERS,
  default3 as EventBusAdapter,
  default2 as GlobalStateAdapter,
  MODULE_ID,
  VERSION,
  adaptersHealthCheck,
  adapters_default as default,
  healthCheck,
  info
};
