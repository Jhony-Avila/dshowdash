import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.6.0-ES6";
const MODULE_ID = "header.telemetry.tracker";
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
const NAMESPACE = "header";
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error.apply(logger, [`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn.apply(logger, [`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
function TelemetryTracker(config, logger) {
  const self = this;
  this.config = config || {};
  this.logger = logger;
  this.settings = { enabled: this.config.telemetry && this.config.telemetry.enabled || true, instanceId: this.config.instanceId || "header-telemetry" };
  this.isDestroyed = false;
  this._Telemetry = null;
  this._metrics = { trackCount: 0, bootCount: 0, errorCount: 0, metricCount: 0, flushCount: 0, lastTrackAt: null };
  this._initTelemetryCore();
  _log("info", "TelemetryTracker created");
}
TelemetryTracker.prototype._initTelemetryCore = function() {
  const self = this;
  _initPorts();
  try {
    import("/assets/js/core/telemetry-core/index.js").then((mod) => {
      self._Telemetry = mod.Telemetry || mod.default;
      if (self._Telemetry && self._Telemetry.isReady && !self._Telemetry.isReady()) {
        if (self._Telemetry.init) self._Telemetry.init({ endpoint: "/api/telemetry", debug: false, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 });
      }
      if (self._Telemetry && self._Telemetry.setContext) self._Telemetry.setContext({ component: NAMESPACE, instanceId: self.settings.instanceId });
      _log("debug", "Telemetry Core initialized");
    }).catch((err) => {
      _log("warn", "Telemetry Core not available:", err.message);
    });
  } catch (e) {
    _log("warn", "Telemetry Core import failed:", e.message);
  }
};
TelemetryTracker.prototype.track = function(eventName, payload) {
  payload = payload || {};
  if (this.isDestroyed || !this.settings.enabled) return false;
  try {
    const severity = eventName.indexOf("error") !== -1 || eventName.indexOf("critical") !== -1 ? "error" : "info";
    if (this._Telemetry && this._Telemetry.event) this._Telemetry.event(`${NAMESPACE}:${eventName}`, payload, { component: NAMESPACE, severity });
    this._metrics.trackCount++;
    this._metrics.lastTrackAt = Date.now();
    _log("debug", "Track:", eventName, payload);
    return true;
  } catch (error) {
    this._metrics.errorCount++;
    _log("error", "Erro no track:", error);
    return false;
  }
};
TelemetryTracker.prototype.trackBoot = function(version, ua, tz, locale) {
  this._metrics.bootCount++;
  return this.track("boot", { version, ua, tz, locale });
};
TelemetryTracker.prototype.trackNetChange = function(data) {
  return this.track("net:change", data);
};
TelemetryTracker.prototype.trackNetError = function(error, timeoutCount) {
  this._metrics.errorCount++;
  if (this._Telemetry && this._Telemetry.error) this._Telemetry.error(`${NAMESPACE}:net:error`, { error, timeoutCount, at: Date.now() }, { component: NAMESPACE });
  return true;
};
TelemetryTracker.prototype.trackAlertsUpdate = function(critical, warning, lastErrorAt) {
  return this.track("alerts:update", { critical, warning, lastErrorAt });
};
TelemetryTracker.prototype.trackAlertsClick = function(critical, warning) {
  return this.track("alerts:click", { critical, warning });
};
TelemetryTracker.prototype.trackRefreshRequest = function(timestamp) {
  this._metrics.metricCount++;
  if (this._Telemetry && this._Telemetry.metric) this._Telemetry.metric(`${NAMESPACE}:refresh:request`, { timestamp, value: timestamp }, { component: NAMESPACE });
  return true;
};
TelemetryTracker.prototype.trackRefreshState = function(busy, since) {
  return this.track("refresh:state", { busy, since });
};
TelemetryTracker.prototype.trackRefreshDone = function(success, durationMs, reason) {
  this._metrics.metricCount++;
  if (this._Telemetry && this._Telemetry.metric) this._Telemetry.metric(`${NAMESPACE}:refresh:done`, { duration: durationMs, success, reason, unit: "ms" }, { component: NAMESPACE });
  return true;
};
TelemetryTracker.prototype.trackAuthExpired = function(status) {
  if (this._Telemetry && this._Telemetry.error) this._Telemetry.error(`${NAMESPACE}:auth:expired`, { status }, { component: NAMESPACE, severity: "warn" });
  return true;
};
TelemetryTracker.prototype.getMetrics = function() {
  const stats = this._Telemetry && this._Telemetry.getStats ? this._Telemetry.getStats() : {};
  return Object.assign({}, this._metrics, { coreStats: stats, instanceId: this.settings.instanceId, isDestroyed: this.isDestroyed });
};
TelemetryTracker.prototype.resetMetrics = function() {
  const self = this;
  Object.keys(this._metrics).forEach((k) => {
    self._metrics[k] = typeof self._metrics[k] === "number" ? 0 : null;
  });
};
TelemetryTracker.prototype.healthCheck = function() {
  const coreReady = this._Telemetry && this._Telemetry.isReady && this._Telemetry.isReady() || false;
  const checks = { notDestroyed: !this.isDestroyed, enabled: this.settings.enabled, telemetryCoreAvailable: !!this._Telemetry, telemetryCoreReady: coreReady, hasInstanceId: !!this.settings.instanceId, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
TelemetryTracker.prototype.getHistory = function(limit) {
  const buffer = this._Telemetry && this._Telemetry.getBufferSnapshot ? this._Telemetry.getBufferSnapshot().filter((e) => e.component === NAMESPACE) : [];
  return limit ? buffer.slice(-limit) : buffer;
};
TelemetryTracker.prototype.getEventsByType = function(eventName, limit) {
  const filtered = this._Telemetry && this._Telemetry.getBufferSnapshot ? this._Telemetry.getBufferSnapshot().filter((e) => e.event === `${NAMESPACE}:${eventName}`) : [];
  return limit ? filtered.slice(-limit) : filtered;
};
TelemetryTracker.prototype.setSampleRate = function(rate) {
  if (typeof rate !== "number" || rate < 0 || rate > 1) {
    _log("error", "Sample rate deve ser entre 0 e 1");
    return false;
  }
  if (this._Telemetry && this._Telemetry.setSampleRate) this._Telemetry.setSampleRate({ info: rate, debug: rate * 0.5 });
  return true;
};
TelemetryTracker.prototype.setEnabled = function(enabled) {
  this.settings.enabled = !!enabled;
};
TelemetryTracker.prototype.setDebug = (enabled) => {
};
TelemetryTracker.prototype.flush = function() {
  this._metrics.flushCount++;
  return this._Telemetry && this._Telemetry.flush ? this._Telemetry.flush("header-manual") : void 0;
};
TelemetryTracker.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: this.settings.enabled, instanceId: this.settings.instanceId, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
TelemetryTracker.prototype.getVersion = () => VERSION;
TelemetryTracker.prototype.destroy = function() {
  if (this.isDestroyed) return;
  this.isDestroyed = true;
  _log("info", "TelemetryTracker destroyed");
};
function getVersion() {
  return VERSION;
}
var tracker_default = TelemetryTracker;
export {
  MODULE_ID,
  TelemetryTracker,
  VERSION,
  tracker_default as default,
  getPorts,
  getVersion,
  injectPorts
};
