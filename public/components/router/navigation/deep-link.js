import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "components.router.navigation.deep-link";
const VERSION = "2.2.0-P18EC";
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
const _state = { initialized: false, handlers: {}, pending: null };
const _metrics = { parsed: 0, handled: 0, deferred: 0, errors: 0 };
function _track(eventName, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function parseDeepLink(url) {
  _metrics.parsed++;
  if (!url) return null;
  try {
    const urlObj = typeof URL !== "undefined" ? new URL(url, "http://localhost") : { pathname: url, searchParams: { get() {
      return null;
    } } };
    const path = urlObj.pathname || "/";
    const params = {};
    if (urlObj.searchParams) {
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    return { path, params, raw: url };
  } catch (e) {
    _metrics.errors++;
    return null;
  }
}
function registerHandler(pattern, handler) {
  if (!pattern || typeof handler !== "function") return { ok: false, error: "Invalid arguments" };
  _state.handlers[pattern] = handler;
  return { ok: true, pattern };
}
function unregisterHandler(pattern) {
  if (_state.handlers[pattern]) {
    delete _state.handlers[pattern];
    return { ok: true };
  }
  return { ok: false, reason: "Handler not found" };
}
function handleDeepLink(url, options = {}) {
  const parsed = parseDeepLink(url);
  if (!parsed) return { ok: false, error: "Invalid URL" };
  for (const pattern in _state.handlers) {
    if (_state.handlers.hasOwnProperty(pattern)) {
      const regex = new RegExp(`^${pattern.replace(/:\w+/g, "([^/]+)")}$`);
      if (regex.test(parsed.path)) {
        try {
          _state.handlers[pattern](parsed, options);
          _metrics.handled++;
          _track("router:deeplink:handled", { pattern, path: parsed.path });
          _emit(ROUTER_EVENTS.DEEPLINK_HANDLED, { pattern, parsed });
          return { ok: true, pattern, parsed };
        } catch (e) {
          _metrics.errors++;
          return { ok: false, error: e.message };
        }
      }
    }
  }
  if (options.defer) {
    _state.pending = { url, options, timestamp: Date.now() };
    _metrics.deferred++;
    return { ok: true, deferred: true };
  }
  return { ok: false, reason: "No handler matched" };
}
function processPending() {
  if (!_state.pending) return { ok: false, reason: "No pending deep link" };
  const pending = _state.pending;
  _state.pending = null;
  return handleDeepLink(pending.url, Object.assign({}, pending.options, { defer: false }));
}
function getPending() {
  return _state.pending;
}
function clearPending() {
  _state.pending = null;
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  _track("router:deep-link:init", { version: VERSION });
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.handlers = {};
  _state.pending = null;
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, hasPending: { ok: !_state.pending, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, handlersCount: Object.keys(_state.handlers).length, hasPending: !!_state.pending, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var deep_link_default = { MODULE_ID, VERSION, init, cleanup, parseDeepLink, registerHandler, unregisterHandler, handleDeepLink, processPending, getPending, clearPending, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  clearPending,
  deep_link_default as default,
  getPending,
  getPorts,
  handleDeepLink,
  healthCheck,
  info,
  init,
  injectPorts,
  parseDeepLink,
  processPending,
  registerHandler,
  unregisterHandler
};
