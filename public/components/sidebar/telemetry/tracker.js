import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.6.2-P22";
const MODULE_ID = "sidebar.telemetry.tracker";
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
class SidebarTracker {
  constructor(options = {}) {
    this._enabled = options.enabled ?? true;
    this._prefix = options.prefix ?? "sidebar:";
    this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null };
  }
  _getTelemetry() {
    return _getPort("telemetryCore") || _getPort("telemetry");
  }
  track(event, data = {}) {
    if (!this._enabled) return;
    _initPorts();
    const telemetry = this._getTelemetry();
    const fullEvent = event.startsWith(this._prefix) ? event : `${this._prefix}${event}`;
    const payload = { source: MODULE_ID, timestamp: Date.now(), ...data };
    if (telemetry?.track) telemetry.track(fullEvent, payload);
    this._metrics.tracks++;
    this._metrics.lastTrack = { event: fullEvent, timestamp: Date.now() };
  }
  trackNavigation(itemId, route) {
    this.track("navigate", { itemId, route });
    this._metrics.navigations++;
  }
  trackToggle(collapsed) {
    this.track("toggle", { collapsed });
    this._metrics.toggles++;
  }
  trackSectionToggle(sectionId, expanded) {
    this.track("section:toggle", { sectionId, expanded });
    this._metrics.sectionToggles++;
  }
  trackSearch(query, resultsCount) {
    this.track("search", { query, resultsCount });
    this._metrics.searches++;
  }
  trackError(error, context = {}) {
    this.track("error", { error: error?.message || error, ...context });
    this._metrics.errors++;
  }
  // @ts-expect-error strict migration — TS2322
  trackKeyboardNav(action, itemId = null) {
    this.track("keyboard:nav", { action, itemId });
  }
  setEnabled(value) {
    this._enabled = !!value;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  reset() {
    this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null };
  }
  healthCheck() {
    const hasTelemetry = !!this._getTelemetry();
    const checks = { enabled: this._enabled, hasTelemetry, noErrors: this._metrics.errors === 0, trackingWorks: this._metrics.tracks >= 0, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed >= 4 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  getInfo() {
    return { moduleId: MODULE_ID, version: VERSION, enabled: this._enabled, prefix: this._prefix, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics() };
  }
}
function createTracker(options) {
  return new SidebarTracker(options);
}
let _defaultInstance = null;
function getDefaultTracker() {
  if (!_defaultInstance) _defaultInstance = new SidebarTracker();
  return _defaultInstance;
}
function getMetrics() {
  return getDefaultTracker().getMetrics();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  return getDefaultTracker().healthCheck();
}
var tracker_default = { VERSION, MODULE_ID, SidebarTracker, createTracker, getDefaultTracker, info, getMetrics, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  SidebarTracker,
  VERSION,
  createTracker,
  tracker_default as default,
  getDefaultTracker,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
