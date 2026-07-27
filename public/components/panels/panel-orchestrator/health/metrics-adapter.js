import { createTelemetryPorts } from "/core/runtime/ports-profiles.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import orchestratorBus from "../bus/event-bus-adapter.js";
import { getSnapshot } from "../state/selectors.js";
import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-metrics-adapter";
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
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
function MetricsAdapter() {
  this.metricsBuffer = [];
  this.bufferSize = 100;
  this.flushInterval = null;
  this.flushIntervalMs = 6e4;
  this.counters = /* @__PURE__ */ new Map();
  this.gauges = /* @__PURE__ */ new Map();
  this.timings = [];
  this.maxTimings = 1e3;
  this.initialized = false;
  this.destroyed = false;
  this.initTimestamp = null;
}
MetricsAdapter.prototype.getVersion = () => VERSION;
MetricsAdapter.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
MetricsAdapter.prototype.init = function(config = {}) {
  const self = this;
  if (this.initialized) return this;
  _initPorts();
  this.bufferSize = config.bufferSize || 100;
  this.flushIntervalMs = config.flushIntervalMs || 6e4;
  this._startAutoFlush();
  this.initialized = true;
  this.destroyed = false;
  this.initTimestamp = Date.now();
  logger.info(`Metrics Adapter inicializado (${VERSION})`);
  return this;
};
MetricsAdapter.prototype._startAutoFlush = function() {
  const self = this;
  if (this.flushInterval) clearInterval(this.flushInterval);
  this.flushInterval = setInterval(() => {
    self.flush();
  }, this.flushIntervalMs);
};
MetricsAdapter.prototype.record = function(metricName, value, tags = {}) {
  const metric = {
    name: metricName,
    value,
    tags: Object.assign({ source: "orchestrator", moduleId: MODULE_ID }, tags),
    timestamp: Date.now()
  };
  this.metricsBuffer.push(metric);
  if (this.metricsBuffer.length >= this.bufferSize) this.flush();
  return metric;
};
MetricsAdapter.prototype.recordCounter = function(name, increment = 1, tags = {}) {
  const current = this.counters.get(name) || 0;
  this.counters.set(name, current + increment);
  return this.record(`counter.${name}`, current + increment, tags);
};
MetricsAdapter.prototype.recordGauge = function(name, value, tags = {}) {
  this.gauges.set(name, value);
  return this.record(`gauge.${name}`, value, tags);
};
MetricsAdapter.prototype.recordTiming = function(name, durationMs, tags = {}) {
  const timing = { name, duration: durationMs, tags, timestamp: Date.now() };
  this.timings.push(timing);
  if (this.timings.length > this.maxTimings) this.timings.shift();
  return this.record(`timing.${name}`, durationMs, tags);
};
MetricsAdapter.prototype.getCounter = function(name) {
  return this.counters.get(name) || 0;
};
MetricsAdapter.prototype.getGauge = function(name) {
  return this.gauges.get(name);
};
MetricsAdapter.prototype.getTimingStats = function(name) {
  const relevant = this.timings.filter((t) => t.name === name);
  if (relevant.length === 0) return null;
  const durations = relevant.map((t) => t.duration);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const sorted = durations.slice().sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { count: durations.length, avg, min: sorted[0], max: sorted[sorted.length - 1], p50, p95, p99 };
};
MetricsAdapter.prototype.flush = function() {
  if (this.metricsBuffer.length === 0) return;
  const metrics = this.metricsBuffer.slice();
  this.metricsBuffer = [];
  const snapshot = getSnapshot();
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.METRICS_FLUSH, { metrics, snapshot, moduleId: MODULE_ID, timestamp: Date.now() });
  const telemetry = _getPort("telemetryCore");
  if (telemetry && telemetry.track) telemetry.track(ORCHESTRATOR_EVENTS.METRICS_BATCH, { count: metrics.length, moduleId: MODULE_ID });
  logger.debug(`M\xE9tricas enviadas: ${metrics.length}`);
};
MetricsAdapter.prototype.getStats = function() {
  const ps = Ports.snapshot();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: this.initialized,
    destroyed: this.destroyed,
    portsInitialized: ps._initialized,
    bufferSize: this.metricsBuffer.length,
    counters: Object.fromEntries(this.counters),
    gauges: Object.fromEntries(this.gauges),
    timingsCount: this.timings.length,
    uptime: this.initTimestamp ? Date.now() - this.initTimestamp : 0
  };
};
MetricsAdapter.prototype.reset = function() {
  this.metricsBuffer = [];
  this.counters.clear();
  this.gauges.clear();
  this.timings = [];
  this.destroyed = false;
  logger.info("Metrics Adapter resetado");
};
MetricsAdapter.prototype.destroy = function() {
  if (this.flushInterval) {
    clearInterval(this.flushInterval);
    this.flushInterval = null;
  }
  this.flush();
  this.metricsBuffer = [];
  this.counters.clear();
  this.gauges.clear();
  this.timings = [];
  this.initialized = false;
  this.destroyed = true;
  logger.info("Metrics Adapter destru\xEDdo");
};
const metricsAdapter = new MetricsAdapter();
var metrics_adapter_default = metricsAdapter;
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, checks: { metricsAdapterReady: true } };
}
export {
  MODULE_ID,
  MetricsAdapter,
  VERSION,
  metrics_adapter_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  metricsAdapter
};
