import { VERSION, MODULE_ID, BUILTIN_TRANSITIONS } from "./constants.js";
import { _transitions, getConfig, updateConfig, getTotalApplied, getActiveTransitions } from "./state.js";
import { prefersReducedMotion } from "./helpers/motion.js";
import { list } from "./registry/query.js";
function configure(config) {
  if (!config || typeof config !== "object") return false;
  updateConfig(config);
  return true;
}
function getMetrics() {
  const config = getConfig();
  return {
    enabled: config.enabled,
    defaultTransition: config.defaultTransition,
    totalTransitions: Object.keys(_transitions).length,
    builtinCount: list().filter((t) => t.builtin).length,
    customCount: list().filter((t) => t.custom).length,
    totalApplied: getTotalApplied(),
    activeTransitions: getActiveTransitions().size,
    reducedMotion: prefersReducedMotion()
  };
}
function healthCheck() {
  const config = getConfig();
  const metrics = getMetrics();
  const checks = {
    enabled: config.enabled,
    hasBuiltins: metrics.builtinCount > 0,
    defaultExists: !!_transitions[config.defaultTransition],
    noStuckTransitions: metrics.activeTransitions < 10
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics: {
      total: metrics.totalTransitions,
      active: metrics.activeTransitions,
      reducedMotion: metrics.reducedMotion
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: getConfig().enabled,
    config: getConfig(),
    metrics: getMetrics(),
    transitions: list(),
    builtinNames: Object.keys(BUILTIN_TRANSITIONS),
    timestamp: Date.now()
  };
}
export {
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
