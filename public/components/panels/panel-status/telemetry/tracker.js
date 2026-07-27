import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-status.telemetry";
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
class StatusTracker {
  constructor(panelId, options = {}) {
    this.panelId = panelId;
    this.initialized = false;
    this.telemetryCore = null;
    this.metrics = { refreshes: 0, errors: 0, statusChanges: 0 };
    this.sessionStart = Date.now();
    _initPorts();
  }
  init() {
    if (this.initialized) return this;
    try {
      const telemetry = _getPort("telemetry");
      if (telemetry) this.telemetryCore = telemetry;
    } catch (e) {
    }
    this.initialized = true;
    return this;
  }
  track(event, data = {}) {
    if (!this.initialized) this.init();
    const payload = { event: `panel.${this.panelId}.${event}`, panelId: this.panelId, timestamp: Date.now(), source: MODULE_ID, ...data };
    if (this.telemetryCore?.track) this.telemetryCore.track(payload.event, payload);
    return payload;
  }
  trackRefresh(duration, statusCount) {
    this.metrics.refreshes++;
    return this.track(LIFECYCLE_EVENTS.REFRESH, { duration, statusCount });
  }
  trackStatusChange(statusId, oldLevel, newLevel) {
    this.metrics.statusChanges++;
    return this.track(LIFECYCLE_EVENTS.STATE_CHANGED, { statusId, oldLevel, newLevel });
  }
  trackError(error, context) {
    this.metrics.errors++;
    return this.track(LIFECYCLE_EVENTS.ERROR, { error: error?.message || String(error), context });
  }
  getMetrics() {
    return { ...this.metrics, sessionDuration: Date.now() - this.sessionStart };
  }
  healthCheck() {
    return { healthy: true, initialized: this.initialized, hasTelemetryCore: !!this.telemetryCore, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), p22Compliant: true };
  }
  destroy() {
    this.initialized = false;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, p22Compliant: true };
}
var tracker_default = StatusTracker;
export {
  MODULE_ID,
  StatusTracker,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
