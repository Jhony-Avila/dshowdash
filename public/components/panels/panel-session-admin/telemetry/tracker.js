import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin.telemetry.tracker";
const NAMESPACE = "session-admin";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug || false;
};
const metrics = { eventsTracked: 0, lastEventAt: null, errors: 0, sessionStart: Date.now(), refreshCount: 0, terminateCount: 0, exportCount: 0, avgRefreshTime: 0, refreshTimes: [] };
function track(event, data = {}) {
  _initPorts();
  const timestamp = Date.now();
  const payload = Object.assign({ component: MODULE_ID, namespace: NAMESPACE, event, timestamp, sessionDuration: timestamp - metrics.sessionStart, version: VERSION }, data);
  metrics.eventsTracked++;
  metrics.lastEventAt = timestamp;
  const core = _getPort("telemetryCore");
  if (core?.track) {
    try {
      core.track(`${NAMESPACE}:${event}`, payload);
    } catch (e) {
      metrics.errors++;
    }
  }
  const logger = _getPort("logger");
  if (_debug() && logger?.debug) logger.debug(`[${NAMESPACE}:${event}]`, payload);
  return payload;
}
function mounted(context = {}) {
  return track("mount:success", { context, status: "success" });
}
function unmounted(reason = "normal") {
  return track("unmount", { reason, sessionDuration: Date.now() - metrics.sessionStart, totalEvents: metrics.eventsTracked, totalRefreshes: metrics.refreshCount, totalTerminates: metrics.terminateCount });
}
function mountBlocked(reason) {
  return track("mount:blocked", { reason, status: "blocked" });
}
function authRequired(source = "unknown") {
  return track("auth:required", { source, status: "unauthenticated" });
}
function authExpired() {
  return track("auth:expired", { status: "expired" });
}
function authSuccess(userId) {
  return track("auth:success", { userId, status: "authenticated" });
}
function refreshStart() {
  return track("refresh:start", { status: "loading", refreshCount: metrics.refreshCount });
}
function refreshSuccess(duration, sessionsCount, activeCount) {
  metrics.refreshCount++;
  metrics.refreshTimes.push(duration);
  if (metrics.refreshTimes.length > 10) metrics.refreshTimes.shift();
  const sum = metrics.refreshTimes.reduce((a, b) => a + b, 0);
  metrics.avgRefreshTime = Math.round(sum / metrics.refreshTimes.length);
  return track("refresh:success", { duration, sessionsCount, activeCount, status: "success", refreshCount: metrics.refreshCount, avgRefreshTime: metrics.avgRefreshTime });
}
function refreshError(error, duration) {
  metrics.errors++;
  return track("refresh:error", { error: error?.message || String(error), duration, status: "error", errorCount: metrics.errors });
}
function refreshSkipped(reason) {
  return track("refresh:skipped", { reason });
}
function terminateOne(sessionToken, userId) {
  metrics.terminateCount++;
  return track("terminate:one", { sessionToken: sessionToken?.slice(0, 8) || null, userId, status: "success", terminateCount: metrics.terminateCount });
}
function terminateAllOthers(userId, count = 0) {
  metrics.terminateCount += count || 1;
  return track("terminate:all-others", { userId, count, status: "success", terminateCount: metrics.terminateCount });
}
function terminateSelected(count) {
  metrics.terminateCount += count;
  return track("terminate:selected", { count, status: "success", terminateCount: metrics.terminateCount });
}
function terminateError(error, target) {
  metrics.errors++;
  return track("terminate:error", { error: error?.message || String(error), target, status: "error", errorCount: metrics.errors });
}
function filterChanged(filter) {
  return track("filter:changed", { filter });
}
function filterCleared() {
  return track("filter:cleared", {});
}
function exportCSV(count) {
  metrics.exportCount++;
  return track("export:csv", { count, exportCount: metrics.exportCount });
}
function exportJSON(count) {
  metrics.exportCount++;
  return track("export:json", { count, exportCount: metrics.exportCount });
}
function exportClipboard(count) {
  metrics.exportCount++;
  return track("export:clipboard", { count, exportCount: metrics.exportCount });
}
function exportPrint(count) {
  metrics.exportCount++;
  return track("export:print", { count, exportCount: metrics.exportCount });
}
function exportError(format, error) {
  metrics.errors++;
  return track("export:error", { format, error: error?.message || String(error), errorCount: metrics.errors });
}
function fullscreenToggle(active) {
  return track("fullscreen:toggle", { active });
}
function autoRefreshToggle(active) {
  return track("autorefresh:toggle", { active });
}
function selectionChanged(count) {
  return track("selection:changed", { count });
}
function confirmOpened(type, sessionToken) {
  return track("confirm:opened", { type, sessionToken: sessionToken?.slice(0, 8) || null });
}
function confirmConfirmed(type) {
  return track("confirm:confirmed", { type });
}
function confirmCancelled(type) {
  return track("confirm:cancelled", { type });
}
function loadError(error, type) {
  metrics.errors++;
  return track("load:error", { error: error?.message || String(error), type, status: "error", errorCount: metrics.errors });
}
function apiError(endpoint, error, statusCode) {
  metrics.errors++;
  return track("api:error", { endpoint, error: error?.message || String(error), statusCode, errorCount: metrics.errors });
}
function healthCheck() {
  const core = _getPort("telemetryCore");
  const logger = _getPort("logger");
  return { healthy: true, coreAvailable: !!core, loggerReady: !!logger, metrics: Object.assign({}, metrics), sessionDuration: Date.now() - metrics.sessionStart, portsInitialized: Ports.isInitialized(), p22Compliant: true, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, namespace: NAMESPACE, version: VERSION, p22Compliant: true, metrics: Object.assign({}, metrics), coreAvailable: !!_getPort("telemetryCore"), portsInitialized: Ports.isInitialized() };
}
function getMetrics() {
  return Object.assign({}, metrics);
}
function reset() {
  metrics.eventsTracked = 0;
  metrics.lastEventAt = null;
  metrics.errors = 0;
  metrics.sessionStart = Date.now();
  metrics.refreshCount = 0;
  metrics.terminateCount = 0;
  metrics.exportCount = 0;
  metrics.avgRefreshTime = 0;
  metrics.refreshTimes = [];
}
function getVersion() {
  return VERSION;
}
const tracker = { VERSION, MODULE_ID, NAMESPACE, track, mounted, unmounted, mountBlocked, authRequired, authExpired, authSuccess, refreshStart, refreshSuccess, refreshError, refreshSkipped, terminateOne, terminateAllOthers, terminateSelected, terminateError, filterChanged, filterCleared, exportCSV, exportJSON, exportClipboard, exportPrint, exportError, fullscreenToggle, autoRefreshToggle, selectionChanged, confirmOpened, confirmConfirmed, confirmCancelled, loadError, apiError, healthCheck, info, getMetrics, reset, getVersion, injectPorts, getPorts };
var tracker_default = tracker;
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts,
  track,
  tracker
};
