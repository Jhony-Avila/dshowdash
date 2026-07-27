import { getRouteByIdOrPath } from "/components/router/registry/routes.js";
const VERSION = "8.1.0-ROUTE-RESOLVE-FIX";
const MODULE_ID = "main-context-builder";
let _metrics = { contextBuilds: 0, navBuilds: 0, errors: 0, routeLookups: 0, routeHits: 0 };
function buildContext(options = {}) {
  try {
    const { ports: portsDep = {}, adapters: adaptersDep = {}, eventBus = null, router = null, globalState = null, telemetry = null } = options;
    _metrics.contextBuilds++;
    return Object.freeze({
      ports: Object.freeze({ ...portsDep }),
      adapters: Object.freeze({ ...adaptersDep }),
      eventBus,
      router,
      globalState,
      telemetry,
      timestamp: Date.now(),
      version: VERSION
    });
  } catch (error) {
    _metrics.errors++;
    throw error;
  }
}
function buildNavigationContext(route, options = {}) {
  try {
    const path = typeof route === "string" ? route : route?.path || "/";
    const panelId = extractPanelId(path);
    _metrics.navBuilds++;
    const routeObj = typeof route === "string" ? null : route;
    return { path, panelId, params: routeObj?.params || options.params || {}, origin: options.origin || "navigation", timestamp: Date.now() };
  } catch (error) {
    _metrics.errors++;
    throw error;
  }
}
function extractPanelId(path) {
  if (!path || typeof path !== "string") return "panel-cards";
  let clean = path.replace(/^[#/]+/, "").split("?")[0].trim();
  const aliases = { "": "panel-cards", "home": "panel-cards", "dashboard": "panel-cards", "index": "panel-cards" };
  if (aliases[clean] !== void 0) return aliases[clean];
  if (clean.match(/^panel-[a-z0-9-]+$/i)) return clean;
  _metrics.routeLookups++;
  const pathVariants = [
    "/" + clean,
    // /admin/navegacao
    clean,
    // admin/navegacao
    "#/" + clean
    // #/admin/navegacao
  ];
  const firstSegment = clean.split("/")[0];
  if (firstSegment !== clean) {
    pathVariants.push("/" + firstSegment, firstSegment, "#/" + firstSegment);
  }
  for (let i = 0; i < pathVariants.length; i++) {
    const routeDef = getRouteByIdOrPath(pathVariants[i]);
    if (routeDef && routeDef.defaultView) {
      _metrics.routeHits++;
      return routeDef.defaultView;
    }
  }
  return clean || "panel-cards";
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { noErrors: _metrics.errors === 0, hasRouteLookup: true },
    metrics: getMetrics()
  };
}
var context_builder_default = { buildContext, buildNavigationContext, extractPanelId, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  buildContext,
  buildNavigationContext,
  context_builder_default as default,
  extractPanelId,
  getMetrics,
  healthCheck
};
