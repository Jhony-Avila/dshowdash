import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
const MODULE_ID = "panel-permissions-admin.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
const NAMESPACE = "panel";
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
function PanelTelemetryTracker(panelId, config) {
  this.panelId = panelId;
  this.config = config || {};
  this.initialized = false;
  _initPorts();
}
PanelTelemetryTracker.prototype.init = function() {
  if (this.initialized) return this;
  this.initialized = true;
  return this;
};
PanelTelemetryTracker.prototype.track = function(event, data) {
  if (!this.initialized) this.init();
  data = data || {};
  const telemetry = _getPort("telemetry");
  if (telemetry?.event) telemetry.event(PANEL_EVENTS.TELEMETRY, Object.assign({ panelId: this.panelId, event }, data), { component: `${NAMESPACE}-${this.panelId}` });
};
PanelTelemetryTracker.prototype.trackLoad = function(duration, success) {
  if (!this.initialized) this.init();
  if (success === void 0) success = true;
  const telemetry = _getPort("telemetry");
  if (telemetry?.metric) telemetry.metric(PANEL_EVENTS.LOADED, { panelId: this.panelId, duration, success, unit: "ms" }, { component: `${NAMESPACE}-${this.panelId}` });
};
PanelTelemetryTracker.prototype.trackError = function(error, context) {
  if (!this.initialized) this.init();
  if (context === void 0) context = "";
  const telemetry = _getPort("telemetry");
  if (telemetry?.error) telemetry.error(PANEL_EVENTS.ERROR, { panelId: this.panelId, context, message: error?.message || String(error), stack: error?.stack || null }, { component: `${NAMESPACE}-${this.panelId}` });
};
PanelTelemetryTracker.prototype.trackDataRefresh = function(source, success, data) {
  if (!this.initialized) this.init();
  if (success === void 0) success = true;
  data = data || {};
  const telemetry = _getPort("telemetry");
  if (telemetry?.event) telemetry.event(PANEL_EVENTS.REFRESH, Object.assign({ panelId: this.panelId, source, success }, data), { component: `${NAMESPACE}-${this.panelId}` });
};
PanelTelemetryTracker.prototype.trackInteraction = function(action, detail) {
  if (!this.initialized) this.init();
  detail = detail || {};
  const telemetry = _getPort("telemetry");
  if (telemetry?.event) telemetry.event(PANEL_EVENTS.TELEMETRY, Object.assign({ panelId: this.panelId, action, type: "interaction" }, detail), { component: `${NAMESPACE}-${this.panelId}` });
};
const _instance = new PanelTelemetryTracker("panel-permissions-admin");
const Telemetry = {
  track: (event, data) => _instance.track(event, data),
  trackLoad: (duration, success) => _instance.trackLoad(duration, success),
  trackError: (error, context) => _instance.trackError(error, context),
  trackDataRefresh: (source, success, data) => _instance.trackDataRefresh(source, success, data),
  trackInteraction: (action, detail) => _instance.trackInteraction(action, detail),
  init: () => _instance.init()
};
var tracker_default = PanelTelemetryTracker;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { trackerReady: true } };
}
export {
  MODULE_ID,
  PanelTelemetryTracker,
  Telemetry,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
