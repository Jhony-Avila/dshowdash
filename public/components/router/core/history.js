import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.core.history";
const VERSION = "2.3.0-P18EC";
const HISTORY_TELEMETRY = {
  INIT: "router:history:init",
  PUSH: "router:history:push",
  REPLACE: "router:history:replace",
  BACK: "router:history:back",
  FORWARD: "router:history:forward"
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
const _state = { initialized: false, entries: [], currentIndex: -1, maxEntries: 50 };
const _metrics = { pushes: 0, replaces: 0, backs: 0, forwards: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function push(path, state) {
  _metrics.pushes++;
  if (_state.currentIndex < _state.entries.length - 1) _state.entries = _state.entries.slice(0, _state.currentIndex + 1);
  _state.entries.push({ path, state: state || {}, timestamp: Date.now() });
  if (_state.entries.length > _state.maxEntries) _state.entries.shift();
  else _state.currentIndex++;
  _track(HISTORY_TELEMETRY.PUSH, { path });
  return { ok: true, index: _state.currentIndex };
}
function replace(path, state) {
  _metrics.replaces++;
  if (_state.currentIndex >= 0 && _state.currentIndex < _state.entries.length) _state.entries[_state.currentIndex] = { path, state: state || {}, timestamp: Date.now() };
  else return push(path, state);
  _track(HISTORY_TELEMETRY.REPLACE, { path });
  return { ok: true, index: _state.currentIndex };
}
function back() {
  if (_state.currentIndex <= 0) return { ok: false, reason: "At beginning" };
  _state.currentIndex--;
  _metrics.backs++;
  const entry = _state.entries[_state.currentIndex];
  _track(HISTORY_TELEMETRY.BACK, { path: entry.path });
  return { ok: true, entry, index: _state.currentIndex };
}
function forward() {
  if (_state.currentIndex >= _state.entries.length - 1) return { ok: false, reason: "At end" };
  _state.currentIndex++;
  _metrics.forwards++;
  const entry = _state.entries[_state.currentIndex];
  _track(HISTORY_TELEMETRY.FORWARD, { path: entry.path });
  return { ok: true, entry, index: _state.currentIndex };
}
function go(delta) {
  const newIndex = _state.currentIndex + delta;
  if (newIndex < 0 || newIndex >= _state.entries.length) return { ok: false, reason: "Out of bounds" };
  _state.currentIndex = newIndex;
  return { ok: true, entry: _state.entries[newIndex], index: newIndex };
}
function getCurrent() {
  if (_state.currentIndex < 0 || _state.currentIndex >= _state.entries.length) return null;
  return Object.assign({}, _state.entries[_state.currentIndex]);
}
function getEntries() {
  return _state.entries.slice();
}
function canGoBack() {
  return _state.currentIndex > 0;
}
function canGoForward() {
  return _state.currentIndex < _state.entries.length - 1;
}
function clear() {
  _state.entries = [];
  _state.currentIndex = -1;
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.maxEntries) _state.maxEntries = ctx.maxEntries;
  _state.initialized = true;
  _track(HISTORY_TELEMETRY.INIT, { version: VERSION });
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const score = _state.initialized ? 100 : 50;
  return { status: score >= 80 ? "HEALTHY" : "DEGRADED", score, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, entriesCount: _state.entries.length, currentIndex: _state.currentIndex, canGoBack: canGoBack(), canGoForward: canGoForward(), metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
const HistoryManager = {
  MODULE_ID,
  VERSION,
  HISTORY_TELEMETRY,
  init,
  push,
  replace,
  back,
  forward,
  go,
  getCurrent,
  getEntries,
  canGoBack,
  canGoForward,
  clear,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
var history_default = HistoryManager;
export {
  HISTORY_TELEMETRY,
  HistoryManager,
  MODULE_ID,
  VERSION,
  back,
  canGoBack,
  canGoForward,
  clear,
  history_default as default,
  forward,
  getCurrent,
  getEntries,
  getPorts,
  go,
  healthCheck,
  info,
  init,
  injectPorts,
  push,
  replace
};
