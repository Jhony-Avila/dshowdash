import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.5.1-P18EC";
const MODULE_ID = "footer.telemetry";
const NAMESPACE = "footer";
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
const log = {
  info(msg, ctx) {
    ctx = ctx || {};
    const logger = _getPort("logger");
    if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx));
  },
  warn(msg, ctx) {
    ctx = ctx || {};
    const logger = _getPort("logger");
    if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx));
  },
  error(msg, ctx) {
    ctx = ctx || {};
    const logger = _getPort("logger");
    if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx));
  },
  debug(msg, ctx) {
    ctx = ctx || {};
    const logger = _getPort("logger");
    if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx));
  }
};
const _metrics = { initCount: 0, eventsTracked: 0, errorsTracked: 0, warningsTracked: 0 };
function FooterTelemetry() {
  this._context = { component: NAMESPACE, version: VERSION, environment: "production", containerId: null };
  this._debugMode = false;
  this._initialized = false;
  this._telemetryCore = null;
}
FooterTelemetry.prototype.init = function(config) {
  config = config || {};
  if (this._initialized) {
    log.warn("Already initialized");
    return;
  }
  _initPorts();
  this._context = { component: this._context.component, version: config.version || this._context.version, environment: config.environment || this._context.environment, containerId: config.containerId || null };
  this._debugMode = config.debug || false;
  this._initTelemetryCore();
  this._initialized = true;
  _metrics.initCount++;
  log.info("Initialized", { context: this._context });
};
FooterTelemetry.prototype._initTelemetryCore = function() {
  const self = this;
  try {
    const telemetry = _getPort("telemetry");
    if (telemetry) {
      self._telemetryCore = telemetry;
      if (self._telemetryCore.isReady && !self._telemetryCore.isReady()) {
        if (self._telemetryCore.init) self._telemetryCore.init({ endpoint: "/api/telemetry/", debug: false, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 });
      }
      if (self._telemetryCore.setContext) self._telemetryCore.setContext({ containerId: self._context.containerId });
      log.info("Telemetry Core connected");
    }
  } catch (error) {
    log.warn("Telemetry Core not available", { error: error.message });
  }
};
FooterTelemetry.prototype.track = function(event, detail, level) {
  detail = detail || {};
  level = level || "info";
  if (event === "tick" && !this._debugMode) return;
  const payload = Object.assign({}, detail, { containerId: this._context.containerId, environment: this._context.environment });
  if (this._telemetryCore) {
    try {
      const fullEvent = `${NAMESPACE}:${event}`;
      if (level === "error") {
        if (this._telemetryCore.error) this._telemetryCore.error(fullEvent, payload, { component: NAMESPACE, severity: "error" });
        _metrics.errorsTracked++;
      } else if (level === "warn") {
        if (this._telemetryCore.event) this._telemetryCore.event(fullEvent, payload, { component: NAMESPACE, severity: "warn" });
        _metrics.warningsTracked++;
      } else {
        if (this._telemetryCore.event) this._telemetryCore.event(fullEvent, payload, { component: NAMESPACE, severity: "info" });
      }
      _metrics.eventsTracked++;
    } catch (e) {
    }
  }
  if (this._debugMode) {
    log.debug(event, detail);
  }
};
FooterTelemetry.prototype.trackFooterEvent = function(event, detail) {
  this.track(event, detail || {}, "info");
};
FooterTelemetry.prototype.trackError = function(event, detail) {
  this.track(event, detail || {}, "error");
};
FooterTelemetry.prototype.trackWarning = function(event, detail) {
  this.track(event, detail || {}, "warn");
};
FooterTelemetry.prototype.info = function(event, detail) {
  this.track(event, detail, "info");
};
FooterTelemetry.prototype.warn = function(event, detail) {
  this.track(event, detail, "warn");
};
FooterTelemetry.prototype.error = function(event, detail) {
  this.track(event, detail, "error");
};
FooterTelemetry.prototype.debug = function(event, detail) {
  if (this._debugMode) this.track(event, detail, "debug");
};
FooterTelemetry.prototype.destroy = function() {
  this._initialized = false;
  log.info("Destroyed");
};
FooterTelemetry.getVersion = () => VERSION;
FooterTelemetry.getMetrics = () => Object.assign({}, _metrics);
FooterTelemetry.prototype.getVersion = () => VERSION;
FooterTelemetry.prototype.getMetrics = () => Object.assign({}, _metrics);
FooterTelemetry.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  const checks = { initialized: this._initialized, hasContext: !!this._context, telemetryCoreAvailable: !!this._telemetryCore, lowErrors: _metrics.errorsTracked < 50, portsInitialized: portsSnapshot._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
};
FooterTelemetry.prototype.getInfo = function() {
  const portsSnapshot = Ports.snapshot();
  return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, context: Object.assign({}, this._context), hasTelemetryCore: !!this._telemetryCore, metrics: this.getMetrics(), portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck() };
};
var tracker_default = FooterTelemetry;
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts
};
