import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { LOCAL_EVENTS } from "../core/contracts.js";
const MODULE_ID = "panel-audit-trail.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
const NAMESPACE = "audit-trail";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
_initPorts();
function _getCurrentPath() {
  const r = _getPort("router");
  if (r?.getCurrentRoute) {
    const c = r.getCurrentRoute();
    return c?.path || (typeof c === "string" ? c : "/");
  }
  if (r?.current) return r.current;
  return "/";
}
const _metrics = { eventsTracked: 0, errorsTracked: 0, tabChanges: 0, filterChanges: 0, exports: 0, refreshes: 0, pageChanges: 0, startedAt: Date.now(), lastEventAt: null };
function _getActorContext() {
  try {
    const adapter = _getPort("auth");
    if (adapter?.isAuthenticated?.()) {
      const user = adapter.getUser?.() || null;
      return { actorUserId: user?.id || null, actorUserName: user?.name || null, actorRoles: adapter.getRoles?.() || [], sessionId: adapter.getSessionId?.() || null };
    }
    const gs = _getPort("globalState");
    if (gs?.isAuthenticated?.()) {
      const u = gs.get?.("user") || {};
      return { actorUserId: u.id || null, actorUserName: u.name || null, actorRoles: u.roles || [], sessionId: gs.get?.("sessionId") || null };
    }
  } catch (e) {
  }
  return { actorUserId: null, actorUserName: null, actorRoles: [], sessionId: null };
}
function _buildPayload(action, data = {}) {
  data = data || {};
  const actor = _getActorContext();
  return Object.assign({ namespace: NAMESPACE, action, source: MODULE_ID, panelId: "panel-audit-trail", route: _getCurrentPath(), timestamp: Date.now(), version: VERSION }, actor, data);
}
function _send(eventName, payload) {
  _metrics.eventsTracked++;
  _metrics.lastEventAt = Date.now();
  try {
    const t = _getPort("telemetry");
    if (t?.event) {
      t.event(eventName, payload);
      return;
    }
    const eb = _getPort("eventBus");
    if (eb?.emit) eb.emit(TELEMETRY_EVENTS.EVENT, { eventName, payload });
  } catch (e) {
  }
}
function trackPanelOpened() {
  _send(LOCAL_EVENTS.OPENED, _buildPayload("panel_opened"));
}
function trackPanelClosed(duration) {
  _send(LOCAL_EVENTS.CLOSED, _buildPayload("panel_closed", { duration }));
}
function trackTabChanged(tab, previousTab) {
  _metrics.tabChanges++;
  _send(LOCAL_EVENTS.TAB_CHANGED, _buildPayload("tab_changed", { tab, previousTab }));
}
function trackFiltersChanged(filters, activeCount) {
  _metrics.filterChanges++;
  _send(LOCAL_EVENTS.FILTERS_CHANGED, _buildPayload("filters_changed", { filters, activeFilterCount: activeCount }));
}
function trackDataLoaded(tab, count, durationMs) {
  _send(LOCAL_EVENTS.DATA_LOADED, _buildPayload("data_loaded", { tab, recordCount: count, loadTimeMs: durationMs }));
}
function trackDataError(error, tab, context = {}) {
  context = context || {};
  _metrics.errorsTracked++;
  _send(LOCAL_EVENTS.DATA_ERROR, _buildPayload("data_error", Object.assign({ error: error?.message || String(error), tab }, context)));
}
function trackRowSelected(logId, logType) {
  _send("audit-trail:row:selected", _buildPayload("row_selected", { logId, logType }));
}
function trackExport(format, count, success) {
  success = success !== false;
  _metrics.exports++;
  const eventName = success ? LOCAL_EVENTS.EXPORT_SUCCESS : "audit-trail:export:error";
  _send(eventName, _buildPayload(success ? "export_success" : "export_error", { format, recordCount: count }));
}
function trackRefresh(tab, auto) {
  auto = auto || false;
  _metrics.refreshes++;
  _send(LOCAL_EVENTS.REFRESH, _buildPayload("refresh", { tab, autoRefresh: auto }));
}
function trackPageChanged(page, direction, total) {
  _metrics.pageChanges++;
  _send("audit-trail:page:changed", _buildPayload("page_changed", { page, direction, totalPages: total }));
}
function trackKeyboardShortcut(shortcut, action) {
  _send("audit-trail:keyboard", _buildPayload("keyboard_shortcut", { shortcut, action }));
}
function trackAccessDenied(reason, resource) {
  _send("audit-trail:access:denied", _buildPayload("access_denied", { reason, resource }));
}
function getMetrics() {
  return Object.assign({}, _metrics, { uptimeMs: Date.now() - _metrics.startedAt });
}
function resetMetrics() {
  _metrics.eventsTracked = 0;
  _metrics.errorsTracked = 0;
  _metrics.tabChanges = 0;
  _metrics.filterChanges = 0;
  _metrics.exports = 0;
  _metrics.refreshes = 0;
  _metrics.pageChanges = 0;
  _metrics.startedAt = Date.now();
  _metrics.lastEventAt = null;
}
function healthCheck() {
  const t = _getPort("telemetry");
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", metrics: getMetrics(), telemetryAvailable: !!t, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function getVersion() {
  return VERSION;
}
var tracker_default = { VERSION, MODULE_ID, NAMESPACE, trackPanelOpened, trackPanelClosed, trackTabChanged, trackFiltersChanged, trackDataLoaded, trackDataError, trackRowSelected, trackExport, trackRefresh, trackPageChanged, trackKeyboardShortcut, trackAccessDenied, getMetrics, resetMetrics, healthCheck, getVersion, injectPorts, getPorts };
export {
  MODULE_ID,
  NAMESPACE,
  VERSION,
  tracker_default as default,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  injectPorts,
  resetMetrics,
  trackAccessDenied,
  trackDataError,
  trackDataLoaded,
  trackExport,
  trackFiltersChanged,
  trackKeyboardShortcut,
  trackPageChanged,
  trackPanelClosed,
  trackPanelOpened,
  trackRefresh,
  trackRowSelected,
  trackTabChanged
};
