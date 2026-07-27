export * from "./context-builder.js";
export * from "./state-machine.js";
export * from "./navigation-controller/index.js";
export * from "./panel-lifecycle-controller.js";
export * from "./multi-container-orchestrator.js";
export * from "./error-supervisor.js";
import {
  createManifestController,
  MANIFEST_TELEMETRY,
  registerManifest,
  getManifest,
  getAllManifests,
  listManifests,
  loadManifest,
  isLoaded,
  getLoadedManifests,
  unregisterManifest
} from "./manifest-controller.js";
export * from "./layout-controller.js";
export * from "./canvas-controller-enterprise.js";
import {
  createTimelineController,
  addEvent,
  getEvents,
  clearEvents
} from "./timeline-controller.js";
export * from "./orchestrator-controller.js";
export * from "./globalstate-controller-v2.js";
import {
  createContainerOrchestrationPolicy,
  DOCK_MODES,
  OPEN_STRATEGIES,
  getPolicy,
  setPolicy,
  resetPolicy,
  checkPolicy
} from "./container-orchestration-policy.js";
import {
  create,
  destroy,
  activate,
  getActive,
  get,
  getAll,
  clear
} from "./canvas-lifecycle-controller.js";
export * from "./flow-controller.js";
export * from "./main-engine.js";
import { createActionHub } from "./action-hub/index.js";
import { default as default2 } from "./action-hub/index.js";
import { createAuditModule } from "./audit/index.js";
import { createObservabilityModule } from "./observability/index.js";
import { createPersistenceAdapter } from "./persistence/index.js";
const VERSION = "8.2.0-FIX";
const MODULE_ID = "main-domain";
const DOMAIN_MODULES = [
  "context-builder",
  "state-machine",
  "navigation-controller",
  "panel-lifecycle-controller",
  "multi-container-orchestrator",
  "error-supervisor",
  "manifest-controller",
  "layout-controller",
  "canvas-controller-enterprise",
  "timeline-controller",
  "orchestrator-controller",
  "globalstate-controller-v2",
  "container-orchestration-policy",
  "canvas-lifecycle-controller",
  "flow-controller",
  "main-engine",
  "action-hub",
  "audit",
  "observability",
  "persistence"
];
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    modules: DOMAIN_MODULES,
    moduleCount: DOMAIN_MODULES.length
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    modules: DOMAIN_MODULES,
    moduleCount: DOMAIN_MODULES.length
  };
}
var domain_default = { VERSION, MODULE_ID, healthCheck, info, DOMAIN_MODULES };
export {
  default2 as ActionHub,
  DOCK_MODES,
  MANIFEST_TELEMETRY,
  MODULE_ID,
  OPEN_STRATEGIES,
  VERSION,
  activate,
  addEvent,
  checkPolicy,
  clear,
  clearEvents,
  create,
  createActionHub,
  createAuditModule,
  createContainerOrchestrationPolicy,
  createManifestController,
  createObservabilityModule,
  createPersistenceAdapter,
  createTimelineController,
  domain_default as default,
  destroy,
  get,
  getActive,
  getAll,
  getAllManifests,
  getEvents,
  getLoadedManifests,
  getManifest,
  getPolicy,
  healthCheck,
  info,
  isLoaded,
  listManifests,
  loadManifest,
  registerManifest,
  resetPolicy,
  setPolicy,
  unregisterManifest
};
