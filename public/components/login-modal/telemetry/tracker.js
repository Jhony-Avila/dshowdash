import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "login-modal.telemetry.tracker";
const VERSION = "5.6.0-P24";
const NAMESPACE = "login-modal";
const SEVERITY = { INFO: "info", WARN: "warn", ERROR: "error" };
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
function TelemetryTracker(config, deps) {
  config = config || {};
  deps = deps || {};
  _initPorts();
  this.config = config;
  this.logger = deps.logger || _getPort("logger") || console;
  this.enabled = config.telemetry && config.telemetry.enabled !== false;
  this.namespace = config.telemetry && config.telemetry.namespace || "auth";
  this.version = config.version || "1.0.0";
  this.telemetryCoreAvailable = false;
  this.Telemetry = null;
  this.metadata = { version: this.version, deviceId: deps.deviceId || null };
  this._metrics = { events: 0, errors: 0 };
  this._initTelemetryCore();
}
TelemetryTracker.prototype._initTelemetryCore = function() {
  const self = this;
  import("../../../assets/js/core/telemetry-core/index.js").then((module) => {
    self.Telemetry = module.Telemetry;
    if (self.Telemetry && typeof self.Telemetry.isReady === "function") {
      if (!self.Telemetry.isReady()) {
        self.Telemetry.init({ endpoint: "/api/telemetry", debug: false, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 });
      }
      self.Telemetry.setContext(Object.assign({ module: NAMESPACE }, self.metadata));
      self.telemetryCoreAvailable = true;
    }
  }).catch(() => {
    self.telemetryCoreAvailable = false;
  });
};
TelemetryTracker.prototype.emit = function(eventName, detail, severity) {
  detail = detail || {};
  severity = severity || SEVERITY.INFO;
  if (!this.enabled) return;
  this._metrics.events++;
  const traceId = this.logger.getTraceId && this.logger.getTraceId() || null;
  const payload = Object.assign({}, detail, { traceId, module: NAMESPACE }, this.metadata);
  if (this.telemetryCoreAvailable && this.Telemetry) {
    try {
      this.Telemetry.event(`${NAMESPACE}:${eventName}`, payload, { component: NAMESPACE, severity });
    } catch (e) {
    }
  }
};
TelemetryTracker.prototype.trackOpen = function(reason) {
  reason = reason || "manual";
  this.emit(`${this.namespace}:open`, { reason }, SEVERITY.INFO);
};
TelemetryTracker.prototype.trackBusy = function() {
  this.emit(`${this.namespace}:busy`, { state: "loading" }, SEVERITY.INFO);
};
TelemetryTracker.prototype.trackSuccess = function(user, latencyMs) {
  if (this.telemetryCoreAvailable && this.Telemetry) {
    try {
      this.Telemetry.metric(`${NAMESPACE}:${this.namespace}:success`, { userId: user && user.id || null, duration: latencyMs, unit: "ms" }, { component: NAMESPACE });
    } catch (e) {
    }
  }
};
TelemetryTracker.prototype.trackError = function(errorCode, errorMessage, latencyMs) {
  this._metrics.errors++;
  if (this.telemetryCoreAvailable && this.Telemetry) {
    try {
      this.Telemetry.error(`${NAMESPACE}:${this.namespace}:error`, { errorCode, errorMessage, latencyMs }, { component: NAMESPACE });
    } catch (e) {
    }
  }
};
TelemetryTracker.prototype.trackLocked = function(cooldownMs, attempts) {
  this.emit(`${this.namespace}:locked`, { cooldownMs, attempts }, SEVERITY.WARN);
};
TelemetryTracker.prototype.trackClose = function(reason) {
  reason = reason || "manual";
  this.emit(`${this.namespace}:close`, { reason }, SEVERITY.INFO);
};
TelemetryTracker.prototype.setMetadata = function(key, value) {
  this.metadata[key] = value;
  if (this.telemetryCoreAvailable && this.Telemetry) {
    const ctx = {};
    ctx[key] = value;
    try {
      this.Telemetry.setContext(ctx);
    } catch (e) {
    }
  }
};
TelemetryTracker.prototype.flushBatch = function() {
  if (this.telemetryCoreAvailable && this.Telemetry) {
    try {
      return this.Telemetry.flush("login-modal-manual");
    } catch (e) {
    }
  }
  return Promise.resolve();
};
TelemetryTracker.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, namespace: this.namespace, telemetryCoreAvailable: this.telemetryCoreAvailable, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
TelemetryTracker.prototype.healthCheck = function() {
  const checks = { enabled: this.enabled, hasLogger: !!this.logger, telemetryCoreAvailable: this.telemetryCoreAvailable, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, p24Instrumented: true, p24DynamicEventsAllowed: 4, timestamp: Date.now() };
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { moduleLoaded: true, classAvailable: typeof TelemetryTracker === "function", portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, p24Instrumented: true, p24DynamicEventsAllowed: 4, timestamp: Date.now() };
}
var tracker_default = TelemetryTracker;
export {
  MODULE_ID,
  TelemetryTracker,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
