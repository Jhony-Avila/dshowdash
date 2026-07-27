// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-metrics-adapter
// PURPOSE: Metrics Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//   ORCHESTRATOR_EVENTS from /core/runtime/events/catalog/orchestrator.events.js
//   getSnapshot from ../state/selectors.js
//   orchestratorBus from ../bus/event-bus-adapter.js
//   logger from ../utils/logger.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MetricsAdapter() — exported function
//   metricsAdapter — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ORCHESTRATOR_EVENTS.METRICS_FLUSH
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
import orchestratorBus from '../bus/event-bus-adapter.js';
import { getSnapshot } from '../state/selectors.js';
import logger from '../utils/logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-metrics-adapter';

const Ports = createTelemetryPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function MetricsAdapter(this: any) {
  this.metricsBuffer = [];
  this.bufferSize = 100;
  this.flushInterval = null;
  this.flushIntervalMs = 60000;
  this.counters = new Map();
  this.gauges = new Map();
  this.timings = [];
  this.maxTimings = 1000;
  this.initialized = false;
  this.destroyed = false;
  this.initTimestamp = null;
}

MetricsAdapter.prototype.getVersion = () => VERSION;
MetricsAdapter.prototype.isInitialized = function() { return this.initialized && !this.destroyed; };

MetricsAdapter.prototype.init = function(config: Record<string, unknown> = {}) {
  const self = this;
  if (this.initialized) return this;
  _initPorts();
  this.bufferSize = config.bufferSize || 100;
  this.flushIntervalMs = config.flushIntervalMs || 60000;
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
  this.flushInterval = setInterval(() => { self.flush(); }, this.flushIntervalMs);
};

MetricsAdapter.prototype.record = function(metricName: string, value: number, tags: Record<string, unknown> = {}) {
  const metric = {
    name: metricName,
    value,
    tags: Object.assign({ source: 'orchestrator', moduleId: MODULE_ID }, tags),
    timestamp: Date.now()
  };
  this.metricsBuffer.push(metric);
  if (this.metricsBuffer.length >= this.bufferSize) this.flush();
  return metric;
};

MetricsAdapter.prototype.recordCounter = function(name: string, increment: number = 1, tags: Record<string, unknown> = {}) {
  const current = this.counters.get(name) || 0;
  this.counters.set(name, current + increment);
  return this.record(`counter.${name}`, current + increment, tags);
};

MetricsAdapter.prototype.recordGauge = function(name: string, value: number, tags: Record<string, unknown> = {}) {
  this.gauges.set(name, value);
  return this.record(`gauge.${name}`, value, tags);
};

MetricsAdapter.prototype.recordTiming = function(name: string, durationMs: number, tags: Record<string, unknown> = {}) {
  const timing = { name, duration: durationMs, tags, timestamp: Date.now() };
  this.timings.push(timing);
  if (this.timings.length > this.maxTimings) this.timings.shift();
  return this.record(`timing.${name}`, durationMs, tags);
};

MetricsAdapter.prototype.getCounter = function(name: string) { return this.counters.get(name) || 0; };
MetricsAdapter.prototype.getGauge = function(name: string) { return this.gauges.get(name); };

MetricsAdapter.prototype.getTimingStats = function(name: string) {
  const relevant = this.timings.filter((t: { name: string; duration: number }) => t.name === name);
  if (relevant.length === 0) return null;
  const durations = relevant.map((t: { name: string; duration: number }) => t.duration);
  const sum = durations.reduce((a: number, b: number) => a + b, 0);
  const avg = sum / durations.length;
  const sorted = durations.slice().sort((a: number, b: number) => a - b);
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
  const telemetry = _getPort('telemetryCore');
  if (telemetry && telemetry.track) telemetry.track(ORCHESTRATOR_EVENTS.METRICS_BATCH, { count: metrics.length, moduleId: MODULE_ID });
  logger.debug(`Métricas enviadas: ${metrics.length}`);
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
  logger.info('Metrics Adapter resetado');
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
  logger.info('Metrics Adapter destruído');
};

// @ts-expect-error strict migration — TS7009
const metricsAdapter = new MetricsAdapter();

export default metricsAdapter;
export { MetricsAdapter, metricsAdapter, VERSION, MODULE_ID };

export function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized };
}

export function healthCheck() {
  const ps = Ports.snapshot();
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, checks: { metricsAdapterReady: true } };
}
