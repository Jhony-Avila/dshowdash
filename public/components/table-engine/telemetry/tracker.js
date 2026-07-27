import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.table-engine.telemetry.tracker";
const VERSION = "2.2.0-P18EC";
const TABLE_TELEMETRY = {
  RENDERED: "table:rendered",
  SORTED: "table:sorted",
  FILTERED: "table:filtered",
  ERROR: "table:error",
  SCROLLED: "table:scrolled"
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
const _metrics = { tracked: 0, renders: 0, sorts: 0, filters: 0, errors: 0 };
function _track(eventKey, payload) {
  _metrics.tracked++;
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID, timestamp: Date.now() }, payload || {}));
  } catch (e) {
    _metrics.errors++;
  }
}
function trackRender(tableId, rowCount, renderTimeMs) {
  _metrics.renders++;
  _track(TABLE_TELEMETRY.RENDERED, { tableId, rowCount, renderTimeMs });
}
function trackSort(tableId, column, direction) {
  _metrics.sorts++;
  _track(TABLE_TELEMETRY.SORTED, { tableId, column, direction });
}
function trackFilter(tableId, filters) {
  _metrics.filters++;
  _track(TABLE_TELEMETRY.FILTERED, { tableId, filterCount: Object.keys(filters || {}).length });
}
function trackError(tableId, error) {
  _metrics.errors++;
  _track(TABLE_TELEMETRY.ERROR, { tableId, error: error.message || String(error) });
}
function trackScroll(tableId, scrollTop, visibleRows) {
  _track(TABLE_TELEMETRY.SCROLLED, { tableId, scrollTop, visibleRows });
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: !!_getPort("telemetry"), severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var tracker_default = { MODULE_ID, VERSION, TABLE_TELEMETRY, init, trackRender, trackSort, trackFilter, trackError, trackScroll, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  TABLE_TELEMETRY,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  trackError,
  trackFilter,
  trackRender,
  trackScroll,
  trackSort
};
