const VERSION = "11.0.0-PHASE4";
const MODULE_ID = "container-main:core";
export * from "./constants.js";
export * from "./event-bridge.js";
export * from "./state.js";
export * from "./label-resolver.js";
export * from "./uarps.js";
export * from "./container-core.js";
export * from "./health.js";
export * from "./dependency-map.js";
import { default as default2 } from "./dependency-map.js";
export * from "./plugin-system.js";
import { default as default3 } from "./plugin-system.js";
export * from "./lifecycle-hooks.js";
import { default as default4 } from "./lifecycle-hooks.js";
export * from "./boot-metrics.js";
import { default as default5 } from "./boot-metrics.js";
export * from "./state-snapshots.js";
import { default as default6 } from "./state-snapshots.js";
const CORE_MODULES = Object.freeze([
  "constants",
  "event-bridge",
  "state",
  "label-resolver",
  "uarps",
  "container-core",
  "health",
  "dependency-map",
  "plugin-system",
  "lifecycle-hooks",
  "boot-metrics",
  "state-snapshots"
]);
async function coreHealthCheckAll() {
  const results = {};
  const modules = ["constants", "event-bridge", "dependency-map", "plugin-system", "lifecycle-hooks", "boot-metrics", "state-snapshots"];
  for (const name of modules) {
    try {
      const mod = await import(`./${name}.js`);
      results[name] = mod.healthCheck?.() || { status: "NO_HEALTHCHECK" };
    } catch (e) {
      results[name] = { status: "IMPORT_ERROR", error: e.message };
    }
  }
  const healthy = Object.values(results).filter((r) => r.status === "HEALTHY" || r.status === "NOT_INITIALIZED").length;
  return {
    status: healthy === Object.keys(results).length ? "HEALTHY" : "DEGRADED",
    summary: { healthy, total: Object.keys(results).length },
    modules: results
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modules: CORE_MODULES, totalModules: CORE_MODULES.length };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, totalModules: CORE_MODULES.length };
}
var core_default = { VERSION, MODULE_ID, CORE_MODULES, coreHealthCheckAll, info, healthCheck };
export {
  default5 as BootMetrics,
  CORE_MODULES,
  default2 as DependencyMap,
  default4 as LifecycleHooks,
  MODULE_ID,
  default3 as PluginSystem,
  default6 as StateSnapshots,
  VERSION,
  coreHealthCheckAll,
  core_default as default,
  healthCheck,
  info
};
