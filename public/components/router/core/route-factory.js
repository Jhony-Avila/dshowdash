import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.core.route-factory";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function extractLayoutHints(config) {
  return { layout: config.layout || "default", defaultView: config.defaultView || null, defaultHash: config.defaultHash || "", virtualDefaults: config.virtualDefaults || null, mountMain: config.mountMain || false, panel: config.panel || null, domain: config.domain || null };
}
function createResolvedRoute(config, canonicalPath, matchType, extras) {
  if (extras === void 0) extras = {};
  const coreRoute = { path: canonicalPath, page: config.page, title: config.title || "", public: !!config.public, requiresAuth: config.requiresAuth !== false, permissions: config.permissions || [], featureFlags: config.featureFlags || [], id: config.id || null, name: config.name || null, tags: config.tags || [], params: extras.params || {}, query: extras.query || {}, hash: extras.hash || "", matched: true, matchType, _aaa: true };
  const layoutHints = extractLayoutHints(config);
  return Object.assign({}, coreRoute, { _layoutHints: layoutHints, layout: layoutHints.layout, defaultView: layoutHints.defaultView, defaultHash: layoutHints.defaultHash, virtualDefaults: layoutHints.virtualDefaults }, extras);
}
function createFallbackRoute(originalPath, notFoundConfig) {
  const notFound = notFoundConfig || {};
  return { path: notFound.path || "/404", page: notFound.page || "not-found", title: notFound.title || "P\xE1gina N\xE3o Encontrada", public: true, requiresAuth: false, permissions: [], featureFlags: [], id: "not-found", name: "not-found", tags: ["error", "404"], params: {}, query: {}, hash: "", matched: false, matchType: "fallback", originalPath, isNotFound: true, _aaa: true, _layoutHints: { layout: "full-screen", defaultView: null, defaultHash: "", virtualDefaults: null, mountMain: false, panel: null, domain: null }, layout: "full-screen", defaultHash: "" };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
var route_factory_default = { extractLayoutHints, createResolvedRoute, createFallbackRoute, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createFallbackRoute,
  createResolvedRoute,
  route_factory_default as default,
  extractLayoutHints,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
