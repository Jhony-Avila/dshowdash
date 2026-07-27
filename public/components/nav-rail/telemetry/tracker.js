import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "navrail-telemetry";
const VERSION = "5.1.0-ES6";
const hasWindow = typeof window !== "undefined";
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`, ...args]);
};
const NavRailTracker = { _namespace: "navrail", _startTime: null, _events: [], _maxEvents: 100, _initialized: false, _metrics: { totalEvents: 0, renders: 0, clicks: 0, modeChanges: 0, errors: 0 }, init() {
  if (this._initialized) return this;
  this._startTime = Date.now();
  this._events = [];
  this._initialized = true;
  this.track("init");
  _log("debug", "Tracker initialized");
  return this;
}, track(event, data) {
  if (!data) data = {};
  if (!this._initialized) this.init();
  const entry = Object.assign({ event: `${this._namespace}:${event}`, timestamp: Date.now() }, data);
  this._events.push(entry);
  if (this._events.length > this._maxEvents) {
    this._events.shift();
  }
  this._metrics.totalEvents++;
  this._updateMetricsByEvent(event);
  const tc = _getPort("telemetry");
  if (tc && tc.track) {
    tc.track(entry.event, data);
  }
  _log("debug", `Event: ${event}`, data);
}, _updateMetricsByEvent(event) {
  if (event.indexOf("render") !== -1) this._metrics.renders++;
  else if (event.indexOf("click") !== -1) this._metrics.clicks++;
  else if (event.indexOf("mode") !== -1) this._metrics.modeChanges++;
  else if (event.indexOf("error") !== -1) this._metrics.errors++;
}, rendered() {
  this.track("render:complete", { duration: Date.now() - (this._startTime || 0) });
}, ready() {
  this.track("ready", { bootTime: Date.now() - (this._startTime || 0) });
}, modeChange(mode) {
  this.track(`mode:${mode}`, { mode });
}, buttonClick(buttonId, meta) {
  if (!meta) meta = {};
  this.track("button:click", Object.assign({ buttonId }, meta));
}, error(error, context) {
  if (!context) context = {};
  this.track("error", Object.assign({ message: error && error.message ? error.message : String(error) }, context));
  _log("error", "Tracked error", Object.assign({ error: error && error.message ? error.message : error }, context));
}, getEvents() {
  return this._events.slice();
}, getRecentEvents(count) {
  if (!count) count = 10;
  return this._events.slice(-count);
}, getMetrics() {
  return Object.assign({}, this._metrics, { startTime: this._startTime, uptime: this._startTime ? Date.now() - this._startTime : 0, eventCount: this._events.length, bufferUsage: `${this._events.length}/${this._maxEvents}` });
}, clearEvents() {
  this._events = [];
  _log("debug", "Events cleared");
  return this;
}, destroy() {
  this.track("destroyed");
  this._events = [];
  this._initialized = false;
  this._startTime = null;
  _log("debug", "Tracker destroyed");
  return this;
}, healthCheck() {
  const ps = Ports.snapshot();
  const logger = _getPort("logger");
  const telemetry = _getPort("telemetry");
  const checks = { initialized: this._initialized, hasStartTime: !!this._startTime, bufferHealthy: this._events.length < this._maxEvents * 0.9, lowErrorRate: this._metrics.totalEvents === 0 || this._metrics.errors / this._metrics.totalEvents < 0.1, loggerAvailable: !!logger, telemetryAvailable: !!telemetry, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: this.getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: Date.now() };
}, info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, namespace: this._namespace, maxEvents: this._maxEvents, currentEvents: this._events.length, metrics: this.getMetrics(), recentEvents: this.getRecentEvents(5).map((e) => e.event), portsInitialized: ps._initialized, timestamp: Date.now() };
} };
if (hasWindow) {
  window.NavRailTracker = NavRailTracker;
}
var tracker_default = NavRailTracker;
export {
  MODULE_ID,
  NavRailTracker,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts
};
