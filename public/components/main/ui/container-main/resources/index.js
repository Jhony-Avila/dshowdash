const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "container-main:resources";
export * from "./circuit-breaker.js";
export * from "./resource-manager/index.js";
export * from "./cleanup-scheduler.js";
export * from "./capability-manager/index.js";
export * from "./layout-manager.js";
export * from "./listener-tracker.js";
export * from "./deprecation-manager.js";
export * from "./compat-layer.js";
export * from "./lifecycle-guard.js";
export * from "./image-virtualizer.js";
export * from "./layout-integration/index.js";
export * from "./metrics-persistence.js";
export * from "./performance-monitor.js";
export * from "./fallback-system.js";
import { default as default2 } from "./circuit-breaker.js";
import { default as default3 } from "./resource-manager/index.js";
import { default as default4 } from "./cleanup-scheduler.js";
import { default as default5 } from "./capability-manager/index.js";
import { default as default6 } from "./layout-manager.js";
import { default as default7 } from "./listener-tracker.js";
import { default as default8 } from "./deprecation-manager.js";
import { default as default9 } from "./compat-layer.js";
import { default as default10 } from "./lifecycle-guard.js";
import { default as default11 } from "./image-virtualizer.js";
import { default as default12 } from "./layout-integration/index.js";
import { default as default13 } from "./metrics-persistence.js";
import { default as default14 } from "./performance-monitor.js";
import { default as default15 } from "./fallback-system.js";
const RESOURCE_MODULES = Object.freeze([
  // Core (12)
  "circuit-breaker",
  "resource-manager",
  "cleanup-scheduler",
  "capability-manager",
  "layout-manager",
  "listener-tracker",
  "deprecation-manager",
  "compat-layer",
  "lifecycle-guard",
  "image-virtualizer",
  "layout-integration",
  "metrics-persistence",
  // Phase 2 (2)
  "performance-monitor",
  "fallback-system"
]);
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modules: RESOURCE_MODULES,
    totalModules: RESOURCE_MODULES.length,
    categories: {
      core: 12,
      phase2: 2
    }
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    modules: RESOURCE_MODULES.length
  };
}
var resources_default = {
  VERSION,
  MODULE_ID,
  RESOURCE_MODULES,
  info,
  healthCheck
};
export {
  default5 as CapabilityManager,
  default2 as CircuitBreaker,
  default4 as CleanupScheduler,
  default9 as CompatLayer,
  default8 as DeprecationManager,
  default15 as FallbackSystem,
  default11 as ImageVirtualizer,
  default12 as LayoutIntegration,
  default6 as LayoutManager,
  default10 as LifecycleGuard,
  default7 as ListenerTracker,
  MODULE_ID,
  default13 as MetricsPersistence,
  default14 as PerformanceMonitor,
  RESOURCE_MODULES,
  default3 as ResourceManager,
  VERSION,
  resources_default as default,
  healthCheck,
  info
};
