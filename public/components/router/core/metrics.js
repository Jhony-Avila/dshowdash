import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.core.metrics";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const metrics = { lastResolvedPath: null, lastResolveTime: null, resolveCount: 0, notFoundCount: 0, dynamicHits: 0, dynamicRoutesLoaded: false, inferredRouteCount: 0, inferredRoutePaths: /* @__PURE__ */ new Set(), strictModeBlockCount: 0, strictModeBlockedPaths: /* @__PURE__ */ new Set(), hardenedBlockCount: 0, hardenedBlockedPaths: /* @__PURE__ */ new Set() };
const aaaMetrics = { routesResolved: 0, routesFromStatic: 0, routesFromDynamic: 0, routesFromPattern: 0, routesBlocked: 0, legacyInferenceAttempts: 0, aaaCompliant: true };
function incrementResolve(path) {
  metrics.resolveCount++;
  aaaMetrics.routesResolved++;
  metrics.lastResolvedPath = path;
  metrics.lastResolveTime = Date.now();
}
function incrementStatic() {
  aaaMetrics.routesFromStatic++;
}
function incrementDynamic() {
  metrics.dynamicHits++;
  aaaMetrics.routesFromDynamic++;
}
function incrementPattern() {
  aaaMetrics.routesFromPattern++;
}
function incrementNotFound() {
  metrics.notFoundCount++;
  aaaMetrics.routesBlocked++;
}
function incrementLegacyInference(path) {
  aaaMetrics.legacyInferenceAttempts++;
  metrics.hardenedBlockCount++;
  metrics.hardenedBlockedPaths.add(path);
}
function recordInferredRoute(path) {
  metrics.inferredRouteCount++;
  metrics.inferredRoutePaths.add(path);
  aaaMetrics.aaaCompliant = false;
}
function setDynamicRoutesLoaded(loaded) {
  metrics.dynamicRoutesLoaded = loaded;
}
function isDynamicRoutesLoaded() {
  return metrics.dynamicRoutesLoaded;
}
function getAAAMetrics() {
  return { routesResolved: aaaMetrics.routesResolved, routesFromStatic: aaaMetrics.routesFromStatic, routesFromDynamic: aaaMetrics.routesFromDynamic, routesFromPattern: aaaMetrics.routesFromPattern, routesBlocked: aaaMetrics.routesBlocked, legacyInferenceAttempts: aaaMetrics.legacyInferenceAttempts, aaaCompliant: aaaMetrics.aaaCompliant, legacyInference: { count: metrics.inferredRouteCount, uniquePaths: metrics.inferredRoutePaths.size, paths: Array.from(metrics.inferredRoutePaths) }, blockedByAAA: { count: metrics.hardenedBlockCount, paths: Array.from(metrics.hardenedBlockedPaths) } };
}
function getMetricsSummary() {
  return { resolved: metrics.resolveCount, notFound: metrics.notFoundCount, dynamicHits: metrics.dynamicHits, lastPath: metrics.lastResolvedPath, lastTime: metrics.lastResolveTime, inferredCount: metrics.inferredRouteCount, hardenedBlockCount: metrics.hardenedBlockCount };
}
function resetMetrics() {
  metrics.resolveCount = 0;
  metrics.notFoundCount = 0;
  metrics.dynamicHits = 0;
  metrics.lastResolvedPath = null;
  metrics.lastResolveTime = null;
  metrics.inferredRouteCount = 0;
  metrics.inferredRoutePaths.clear();
  metrics.strictModeBlockCount = 0;
  metrics.strictModeBlockedPaths.clear();
  metrics.hardenedBlockCount = 0;
  metrics.hardenedBlockedPaths.clear();
  aaaMetrics.routesResolved = 0;
  aaaMetrics.routesFromStatic = 0;
  aaaMetrics.routesFromDynamic = 0;
  aaaMetrics.routesFromPattern = 0;
  aaaMetrics.routesBlocked = 0;
  aaaMetrics.legacyInferenceAttempts = 0;
  aaaMetrics.aaaCompliant = true;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, resolveCount: metrics.resolveCount, portsInitialized: Ports.isInitialized() };
}
var metrics_default = { metrics, aaaMetrics, incrementResolve, incrementStatic, incrementDynamic, incrementPattern, incrementNotFound, incrementLegacyInference, recordInferredRoute, getAAAMetrics, getMetricsSummary, resetMetrics, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  aaaMetrics,
  metrics_default as default,
  getAAAMetrics,
  getMetricsSummary,
  getPorts,
  healthCheck,
  incrementDynamic,
  incrementLegacyInference,
  incrementNotFound,
  incrementPattern,
  incrementResolve,
  incrementStatic,
  info,
  injectPorts,
  isDynamicRoutesLoaded,
  metrics,
  recordInferredRoute,
  resetMetrics,
  setDynamicRoutesLoaded
};
