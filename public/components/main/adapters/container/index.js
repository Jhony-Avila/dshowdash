import { createContainerAdapter } from "./adapter.js";
import { createContainerElement, initDOMFactory, ensureDockSlots, getSlotElement } from "./dom-factory.js";
import { createStateMachine } from "./state-machine.js";
import { createTransactionManager } from "./transactions.js";
import { createRecoveryManager } from "./recovery.js";
import { createLifecycleManager } from "./lifecycle.js";
import { createStateActions } from "./state-actions.js";
import { createFeaturesBridge } from "./features-bridge.js";
import { createManagement } from "./management.js";
import { validateVariant, debounce, throttle, generateId, deepClone } from "./helpers.js";
import {
  STATE,
  POLICY,
  DOCK_SLOTS,
  LAYOUT_MODE,
  BUDGET,
  ENTERPRISE_DEFAULTS,
  CONTAINER_STATES,
  CONTAINER_EVENTS,
  CONTAINER_CONFIG
} from "./constants.js";
import * as internalState from "./internal-state.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-adapters";
const MODULES = [
  "adapter",
  "dom-factory",
  "state-machine",
  "transactions",
  "recovery",
  "lifecycle",
  "state-actions",
  "features-bridge",
  "management",
  "helpers",
  "constants",
  "internal-state"
];
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, modules: MODULES };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modules: MODULES, healthCheck: healthCheck(), timestamp: Date.now() };
}
var container_default = { VERSION, MODULE_ID, healthCheck, info };
export {
  BUDGET,
  CONTAINER_CONFIG,
  CONTAINER_EVENTS,
  CONTAINER_STATES,
  DOCK_SLOTS,
  ENTERPRISE_DEFAULTS,
  LAYOUT_MODE,
  MODULE_ID,
  POLICY,
  STATE,
  VERSION,
  createContainerAdapter,
  createContainerElement,
  createFeaturesBridge,
  createLifecycleManager,
  createManagement,
  createRecoveryManager,
  createStateActions,
  createStateMachine,
  createTransactionManager,
  debounce,
  deepClone,
  container_default as default,
  ensureDockSlots,
  generateId,
  getSlotElement,
  healthCheck,
  info,
  initDOMFactory,
  internalState,
  throttle,
  validateVariant
};
