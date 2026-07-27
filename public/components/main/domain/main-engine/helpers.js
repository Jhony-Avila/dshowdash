import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.0.0-P1-HEX";
const MODULE_ID = "main.domain.main-engine.helpers";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function isAuthenticated(ports) {
  try {
    const p = ports;
    if (p && p.auth && p.auth.isAuthenticated && p.auth.isAuthenticated()) return true;
    const globalsPort = p?.globals || _getPort("globals");
    if (globalsPort) {
      const sessionManager = globalsPort.getSessionManager ? globalsPort.getSessionManager() : null;
      if (sessionManager && sessionManager.isAuthenticated && sessionManager.isAuthenticated()) return true;
      const appContext = globalsPort.getAppContext ? globalsPort.getAppContext() : null;
      if (appContext && appContext.auth && appContext.auth.isAuthenticated && appContext.auth.isAuthenticated()) return true;
      if (globalsPort.isAuthenticatedViaBody && globalsPort.isAuthenticatedViaBody()) return true;
      if (globalsPort.getBodyAttribute) {
        if (globalsPort.getBodyAttribute("data-auth-ready") === "true") return true;
      }
      const dataset = globalsPort.getBodyDataset ? globalsPort.getBodyDataset() : {};
      if (dataset.state === "authenticated") return true;
    }
    return false;
  } catch (e) {
    const gp = _getPort("globals");
    return gp && gp.getBodyAttribute && gp.getBodyAttribute("data-auth-ready") === "true";
  }
}
function extractRouteInfo(data) {
  if (data && data.logicalRoute) {
    const lr = data.logicalRoute;
    const vr = data.virtualRoute;
    return {
      path: lr.path || (vr ? vr.path : null),
      panelId: lr.view || (vr ? vr.view : null),
      layout: lr.layout || (vr ? vr.layout : null)
    };
  }
  if (data && data.path) {
    return { path: data.path, panelId: data.view, layout: data.layout };
  }
  if (data && data.route) {
    const r = data.route;
    if (r.path) return { path: r.path, panelId: r.view, layout: r.layout };
  }
  return { path: null, panelId: null, layout: null };
}
function emitEvent(events, event, data) {
  if (!data) data = {};
  const ev = events;
  if (ev && ev.emit) {
    ev.emit(event, data);
  }
}
function safeAsync(fn, fallback) {
  if (fallback === void 0) fallback = null;
  return Promise.resolve().then(() => fn()).catch(() => fallback);
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    p1HexCompliant: true
  };
}
var helpers_default = { isAuthenticated, extractRouteInfo, emitEvent, safeAsync, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  emitEvent,
  extractRouteInfo,
  getPorts,
  healthCheck,
  injectPorts,
  isAuthenticated,
  safeAsync
};
