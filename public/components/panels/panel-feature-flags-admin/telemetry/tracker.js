import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
const MODULE_ID = "panel-feature-flags-admin.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
class PanelTelemetryTracker {
  constructor(panelId, version) {
    this.panelId = panelId;
    this.version = version;
    this.initialized = false;
    this.telemetryCore = null;
    this.metrics = { loadCount: 0, errorCount: 0, totalLoadTime: 0, interactions: 0, toggleCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, lastActivity: null };
    this.sessionStart = Date.now();
    _initPorts();
  }
  init() {
    if (this.initialized) return;
    try {
      const telemetry = _getPort("telemetry");
      if (telemetry) {
        this.telemetryCore = telemetry;
        this.telemetryCore.register?.({ namespace: `panel:${this.panelId}`, version: this.version, flushIntervalMs: 3e4 });
      }
      this.initialized = true;
    } catch {
    }
  }
  track(event, data = {}) {
    if (!this.initialized) this.init();
    const payload = { event: `panel.${this.panelId}.${event}`, panelId: this.panelId, version: this.version, timestamp: Date.now(), sessionDuration: Date.now() - this.sessionStart, source: MODULE_ID, ...data };
    this.metrics.lastActivity = Date.now();
    if (this.telemetryCore && this.telemetryCore.track) this.telemetryCore.track(payload.event, payload);
    return payload;
  }
  trackLoad(duration, success, itemCount = 0) {
    this.metrics.loadCount++;
    this.metrics.totalLoadTime += duration;
    if (!success) this.metrics.errorCount++;
    return this.track(LIFECYCLE_EVENTS.DATA_LOADED, { duration, success, itemCount, avgLoadTime: this.metrics.totalLoadTime / this.metrics.loadCount });
  }
  trackError(error, context = {}) {
    this.metrics.errorCount++;
    return this.track(LIFECYCLE_EVENTS.ERROR, { error: error?.message || String(error), context, totalErrors: this.metrics.errorCount });
  }
  trackToggle(flagKey, newState) {
    this.metrics.toggleCount++;
    this.metrics.interactions++;
    return this.track("flag.toggle", { flagKey, newState, totalToggles: this.metrics.toggleCount });
  }
  trackCreate(flagKey) {
    this.metrics.createCount++;
    this.metrics.interactions++;
    return this.track("flag.create", { flagKey, totalCreates: this.metrics.createCount });
  }
  trackUpdate(flagKey) {
    this.metrics.updateCount++;
    this.metrics.interactions++;
    return this.track("flag.update", { flagKey, totalUpdates: this.metrics.updateCount });
  }
  trackDelete(flagKey) {
    this.metrics.deleteCount++;
    this.metrics.interactions++;
    return this.track("flag.delete", { flagKey, totalDeletes: this.metrics.deleteCount });
  }
  getMetrics() {
    const now = Date.now();
    return { ...this.metrics, sessionDuration: now - this.sessionStart, avgLoadTime: this.metrics.loadCount > 0 ? (this.metrics.totalLoadTime / this.metrics.loadCount).toFixed(2) : 0, errorRate: this.metrics.loadCount > 0 ? `${(this.metrics.errorCount / this.metrics.loadCount * 100).toFixed(1)}%` : "0%" };
  }
  healthCheck() {
    const metrics = this.getMetrics();
    const errorRate = parseFloat(metrics.errorRate);
    return { healthy: errorRate < 10, initialized: this.initialized, hasTelemetryCore: !!this.telemetryCore, portsInitialized: Ports.isInitialized(), metrics, p22Compliant: true };
  }
  reset() {
    this.metrics = { loadCount: 0, errorCount: 0, totalLoadTime: 0, interactions: 0, toggleCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, lastActivity: null };
    this.sessionStart = Date.now();
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, p22Compliant: true };
}
var tracker_default = PanelTelemetryTracker;
export {
  MODULE_ID,
  PanelTelemetryTracker,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
