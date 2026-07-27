import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { parseRoute, parseHash } from "./parser.js";
const MODULE_ID = "components.router.core.resolver";
const VERSION = "2.3.0-P18EC";
const RESOLVER_TELEMETRY = {
  INIT: "router:resolver:init",
  MATCH: "router:resolve:match",
  FALLBACK: "router:resolve:fallback"
};
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const _state = { initialized: false, routes: [], fallback: null };
const _metrics = { resolves: 0, matches: 0, fallbacks: 0, errors: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function registerRoute(pattern, handler, options = {}) {
  const route = { pattern, handler, name: options.name || pattern, priority: options.priority || 0, meta: options.meta || {} };
  _state.routes.push(route);
  _state.routes.sort((a, b) => b.priority - a.priority);
  return { ok: true, name: route.name };
}
function registerFallback(handler) {
  _state.fallback = handler;
  return { ok: true };
}
function unregisterRoute(nameOrPattern) {
  const idx = _state.routes.findIndex((r) => r.name === nameOrPattern || r.pattern === nameOrPattern);
  if (idx >= 0) {
    _state.routes.splice(idx, 1);
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function resolve(hashOrPath) {
  _metrics.resolves++;
  const parsed = typeof hashOrPath === "string" ? parseHash(hashOrPath) : hashOrPath;
  const path = parsed.path || "/";
  for (let i = 0; i < _state.routes.length; i++) {
    const route = _state.routes[i];
    const params = parseRoute(String(route.pattern), path);
    if (params !== null) {
      _metrics.matches++;
      _track(RESOLVER_TELEMETRY.MATCH, { pattern: route.pattern, path });
      return { ok: true, route, params, query: parsed.query || {}, fragment: parsed.fragment || "", matched: true };
    }
  }
  if (_state.fallback) {
    _metrics.fallbacks++;
    _track(RESOLVER_TELEMETRY.FALLBACK, { path });
    return { ok: true, route: { pattern: "*", handler: _state.fallback, name: "fallback", meta: {} }, params: {}, query: parsed.query || {}, fragment: parsed.fragment || "", matched: false, fallback: true };
  }
  _metrics.errors++;
  return { ok: false, error: "No route matched", path };
}
function getRoutes() {
  return _state.routes.map((r) => ({
    pattern: r.pattern,
    name: r.name,
    priority: r.priority,
    meta: r.meta
  }));
}
function hasRoute(nameOrPattern) {
  return _state.routes.some((r) => r.name === nameOrPattern || r.pattern === nameOrPattern);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  _track(RESOLVER_TELEMETRY.INIT, { version: VERSION });
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.routes = [];
  _state.fallback = null;
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  let score = _state.initialized ? 100 : 50;
  if (_state.routes.length === 0) score -= 20;
  return { status: score >= 80 ? "HEALTHY" : score >= 50 ? "DEGRADED" : "UNHEALTHY", score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "warn" }, hasRoutes: { ok: _state.routes.length > 0, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, routesCount: _state.routes.length, hasFallback: !!_state.fallback, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
const RouteResolver = {
  MODULE_ID,
  VERSION,
  RESOLVER_TELEMETRY,
  init,
  cleanup,
  registerRoute,
  registerFallback,
  unregisterRoute,
  resolve,
  getRoutes,
  hasRoute,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
var resolver_default = RouteResolver;
export {
  MODULE_ID,
  RESOLVER_TELEMETRY,
  RouteResolver,
  VERSION,
  cleanup,
  resolver_default as default,
  getPorts,
  getRoutes,
  hasRoute,
  healthCheck,
  info,
  init,
  injectPorts,
  registerFallback,
  registerRoute,
  resolve,
  unregisterRoute
};
