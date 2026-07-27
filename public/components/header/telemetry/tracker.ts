// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.6.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/telemetry/tracker
// PURPOSE: Telemetry event tracker with Telemetry Core integration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   (dynamic) Telemetry from ../../../assets/js/core/telemetry-core/index.js
// PROVIDES:
//   TelemetryTracker (constructor) — track, trackBoot, trackNetChange, etc.
//   getVersion() — returns module version
//   injectPorts() / getPorts() — port dependency injection
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header - Telemetry Tracker Enterprise
// @version 5.6.0-ES6
// @changelog v5.6.0-ES6 - Task 10.1 B05: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.6.0-ES6';
export const MODULE_ID = 'header.telemetry.tracker';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const NAMESPACE = 'header';
const _debugEnabled = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; };
const _log = function(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error.apply(logger, [`[${MODULE_ID}]`].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [`[${MODULE_ID}]`].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [`[${MODULE_ID}]`].concat(args));
};

export function TelemetryTracker(this: any, config: Record<string,unknown>, logger: Record<string,unknown>) {
  const self = this;
  this.config = config || {};
  this.logger = logger;
  this.settings = { enabled: (this.config.telemetry && this.config.telemetry.enabled) || true, instanceId: this.config.instanceId || 'header-telemetry' };
  this.isDestroyed = false;
  this._Telemetry = null;
  this._metrics = { trackCount: 0, bootCount: 0, errorCount: 0, metricCount: 0, flushCount: 0, lastTrackAt: null };
  this._initTelemetryCore();
  _log('info', 'TelemetryTracker created');
}

TelemetryTracker.prototype._initTelemetryCore = function() {
  const self = this;
  _initPorts();
  try {
    import('/assets/js/core/telemetry-core/index.js').then(mod => {
      self._Telemetry = mod.Telemetry || mod.default;
      if (self._Telemetry && self._Telemetry.isReady && !self._Telemetry.isReady()) {
        if (self._Telemetry.init) self._Telemetry.init({ endpoint: '/api/telemetry', debug: false, flushIntervalMs: 30000, maxBufferSize: 500, batchSize: 20 });
      }
      if (self._Telemetry && self._Telemetry.setContext) self._Telemetry.setContext({ component: NAMESPACE, instanceId: self.settings.instanceId });
      _log('debug', 'Telemetry Core initialized');
    }).catch(err => { _log('warn', 'Telemetry Core not available:', err.message); });
  } catch (e: any) { _log('warn', 'Telemetry Core import failed:', e.message); }
};

TelemetryTracker.prototype.track = function(eventName: string, payload: Record<string,unknown>) {
  payload = payload || {};
  if (this.isDestroyed || !this.settings.enabled) return false;
  try {
    const severity = (eventName.indexOf('error') !== -1 || eventName.indexOf('critical') !== -1) ? 'error' : 'info';
    if (this._Telemetry && this._Telemetry.event) this._Telemetry.event(`${NAMESPACE}:${eventName}`, payload, { component: NAMESPACE, severity });
    this._metrics.trackCount++;
    this._metrics.lastTrackAt = Date.now();
    _log('debug', 'Track:', eventName, payload);
    return true;
  } catch (error) {
    this._metrics.errorCount++;
    _log('error', 'Erro no track:', error);
    return false;
  }
};

TelemetryTracker.prototype.trackBoot = function(version: unknown, ua: unknown, tz: unknown, locale: string) { this._metrics.bootCount++; return this.track('boot', { version, ua, tz, locale }); };
TelemetryTracker.prototype.trackNetChange = function(data: Record<string,unknown>) { return this.track('net:change', data); };
TelemetryTracker.prototype.trackNetError = function(error: unknown, timeoutCount: number) { this._metrics.errorCount++; if (this._Telemetry && this._Telemetry.error) this._Telemetry.error(`${NAMESPACE}:net:error`, { error, timeoutCount, at: Date.now() }, { component: NAMESPACE }); return true; };
TelemetryTracker.prototype.trackAlertsUpdate = function(critical: unknown, warning: unknown, lastErrorAt: unknown) { return this.track('alerts:update', { critical, warning, lastErrorAt }); };
TelemetryTracker.prototype.trackAlertsClick = function(critical: unknown, warning: unknown) { return this.track('alerts:click', { critical, warning }); };
TelemetryTracker.prototype.trackRefreshRequest = function(timestamp: number) { this._metrics.metricCount++; if (this._Telemetry && this._Telemetry.metric) this._Telemetry.metric(`${NAMESPACE}:refresh:request`, { timestamp, value: timestamp }, { component: NAMESPACE }); return true; };
TelemetryTracker.prototype.trackRefreshState = function(busy: unknown, since: unknown) { return this.track('refresh:state', { busy, since }); };
TelemetryTracker.prototype.trackRefreshDone = function(success: boolean, durationMs: unknown, reason: string) { this._metrics.metricCount++; if (this._Telemetry && this._Telemetry.metric) this._Telemetry.metric(`${NAMESPACE}:refresh:done`, { duration: durationMs, success, reason, unit: 'ms' }, { component: NAMESPACE }); return true; };
TelemetryTracker.prototype.trackAuthExpired = function(status: string) { if (this._Telemetry && this._Telemetry.error) this._Telemetry.error(`${NAMESPACE}:auth:expired`, { status }, { component: NAMESPACE, severity: 'warn' }); return true; };

TelemetryTracker.prototype.getMetrics = function() { const stats = (this._Telemetry && this._Telemetry.getStats) ? this._Telemetry.getStats() : {}; return Object.assign({}, this._metrics, { coreStats: stats, instanceId: this.settings.instanceId, isDestroyed: this.isDestroyed }); };
TelemetryTracker.prototype.resetMetrics = function() { const self = this; Object.keys(this._metrics).forEach(k => { self._metrics[k] = typeof self._metrics[k] === 'number' ? 0 : null; }); };

TelemetryTracker.prototype.healthCheck = function() {
  const coreReady = (this._Telemetry && this._Telemetry.isReady && this._Telemetry.isReady()) || false;
  const checks = { notDestroyed: !this.isDestroyed, enabled: this.settings.enabled, telemetryCoreAvailable: !!this._Telemetry, telemetryCoreReady: coreReady, hasInstanceId: !!this.settings.instanceId, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
};

// @ts-expect-error TS migration - TS2339
TelemetryTracker.prototype.getHistory = function(limit: number) { const buffer = (this._Telemetry && this._Telemetry.getBufferSnapshot) ? this._Telemetry.getBufferSnapshot().filter((e: Event) => e.component === NAMESPACE) : []; return limit ? buffer.slice(-limit) : buffer; };
// @ts-expect-error TS migration - TS2339
TelemetryTracker.prototype.getEventsByType = function(eventName: string, limit: number) { const filtered = (this._Telemetry && this._Telemetry.getBufferSnapshot) ? this._Telemetry.getBufferSnapshot().filter((e: Event) => e.event === `${NAMESPACE}:${eventName}`) : []; return limit ? filtered.slice(-limit) : filtered; };
TelemetryTracker.prototype.setSampleRate = function(rate: unknown) { if (typeof rate !== 'number' || rate < 0 || rate > 1) { _log('error', 'Sample rate deve ser entre 0 e 1'); return false; } if (this._Telemetry && this._Telemetry.setSampleRate) this._Telemetry.setSampleRate({ info: rate, debug: rate * 0.5 }); return true; };
TelemetryTracker.prototype.setEnabled = function(enabled: boolean) { this.settings.enabled = !!enabled; };
TelemetryTracker.prototype.setDebug = (enabled: boolean) => { };
TelemetryTracker.prototype.flush = function() { this._metrics.flushCount++; return (this._Telemetry && this._Telemetry.flush) ? this._Telemetry.flush('header-manual') : undefined; };
TelemetryTracker.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.settings.enabled, instanceId: this.settings.instanceId, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; };
TelemetryTracker.prototype.getVersion = () => VERSION;
TelemetryTracker.prototype.destroy = function() { if (this.isDestroyed) return; this.isDestroyed = true; _log('info', 'TelemetryTracker destroyed'); };

export function getVersion() { return VERSION; }
export default TelemetryTracker;
