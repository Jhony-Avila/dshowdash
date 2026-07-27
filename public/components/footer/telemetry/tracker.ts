// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.1-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer.telemetry
// PURPOSE: Footer Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '5.5.1-P18EC';
const MODULE_ID = 'footer.telemetry';
const NAMESPACE = 'footer';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const log = {
  info(msg: string, ctx?: Record<string, unknown>) { ctx = ctx || {}; const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx)); },
  warn(msg: string, ctx?: Record<string, unknown>) { ctx = ctx || {}; const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx)); },
  error(msg: string, ctx?: Record<string, unknown>) { ctx = ctx || {}; const logger = _getPort('logger'); if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx)); },
  debug(msg: string, ctx?: Record<string, unknown>) { ctx = ctx || {}; const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx)); }
};

const _metrics = { initCount: 0, eventsTracked: 0, errorsTracked: 0, warningsTracked: 0 };

function FooterTelemetry(this: any) {
  this._context = { component: NAMESPACE, version: VERSION, environment: 'production', containerId: null };
  this._debugMode = false;
  this._initialized = false;
  this._telemetryCore = null;
}

FooterTelemetry.prototype.init = function(config: Record<string,unknown>) {
  config = config || {};
  if (this._initialized) { log.warn('Already initialized'); return; }
  _initPorts();
  this._context = { component: this._context.component, version: config.version || this._context.version, environment: config.environment || this._context.environment, containerId: config.containerId || null };
  this._debugMode = config.debug || false;
  this._initTelemetryCore();
  this._initialized = true;
  _metrics.initCount++;
  log.info('Initialized', { context: this._context });
};

FooterTelemetry.prototype._initTelemetryCore = function() {
  const self = this;
  try {
    const telemetry = _getPort('telemetry');
    if (telemetry) {
      self._telemetryCore = telemetry;
      if (self._telemetryCore.isReady && !self._telemetryCore.isReady()) {
        if (self._telemetryCore.init) self._telemetryCore.init({ endpoint: '/api/telemetry/', debug: false, flushIntervalMs: 30000, maxBufferSize: 500, batchSize: 20 });
      }
      if (self._telemetryCore.setContext) self._telemetryCore.setContext({ containerId: self._context.containerId });
      log.info('Telemetry Core connected');
    }
  } catch (error: any) { log.warn('Telemetry Core not available', { error: error.message }); }
};

FooterTelemetry.prototype.track = function(event: string, detail: unknown, level: string) {
  detail = detail || {}; level = level || 'info';
  if (event === 'tick' && !this._debugMode) return;
  const payload = Object.assign({}, detail, { containerId: this._context.containerId, environment: this._context.environment });
  if (this._telemetryCore) {
    try {
      const fullEvent = `${NAMESPACE}:${event}`;
      if (level === 'error') { if (this._telemetryCore.error) this._telemetryCore.error(fullEvent, payload, { component: NAMESPACE, severity: 'error' }); _metrics.errorsTracked++; }
      else if (level === 'warn') { if (this._telemetryCore.event) this._telemetryCore.event(fullEvent, payload, { component: NAMESPACE, severity: 'warn' }); _metrics.warningsTracked++; }
      else { if (this._telemetryCore.event) this._telemetryCore.event(fullEvent, payload, { component: NAMESPACE, severity: 'info' }); }
      _metrics.eventsTracked++;
    } catch (e) {}
  }
  // @ts-expect-error TS migration - TS2345
  if (this._debugMode) { log.debug(event, detail); }
};

FooterTelemetry.prototype.trackFooterEvent = function(event: string, detail: unknown) { this.track(event, detail || {}, 'info'); };
FooterTelemetry.prototype.trackError = function(event: string, detail: unknown) { this.track(event, detail || {}, 'error'); };
FooterTelemetry.prototype.trackWarning = function(event: string, detail: unknown) { this.track(event, detail || {}, 'warn'); };
FooterTelemetry.prototype.info = function(event: string, detail: unknown) { this.track(event, detail, 'info'); };
FooterTelemetry.prototype.warn = function(event: string, detail: unknown) { this.track(event, detail, 'warn'); };
FooterTelemetry.prototype.error = function(event: string, detail: unknown) { this.track(event, detail, 'error'); };
FooterTelemetry.prototype.debug = function(event: string, detail: unknown) { if (this._debugMode) this.track(event, detail, 'debug'); };
FooterTelemetry.prototype.destroy = function() { this._initialized = false; log.info('Destroyed'); };

FooterTelemetry.getVersion = () => VERSION;
FooterTelemetry.getMetrics = () => Object.assign({}, _metrics);
FooterTelemetry.prototype.getVersion = () => VERSION;
FooterTelemetry.prototype.getMetrics = () => Object.assign({}, _metrics);

FooterTelemetry.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  const checks = { initialized: this._initialized, hasContext: !!this._context, telemetryCoreAvailable: !!this._telemetryCore, lowErrors: _metrics.errorsTracked < 50, portsInitialized: portsSnapshot._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
};

FooterTelemetry.prototype.getInfo = function() {
  const portsSnapshot = Ports.snapshot();
  return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, context: Object.assign({}, this._context), hasTelemetryCore: !!this._telemetryCore, metrics: this.getMetrics(), portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck() };
};

export { MODULE_ID, VERSION };
export default FooterTelemetry;
