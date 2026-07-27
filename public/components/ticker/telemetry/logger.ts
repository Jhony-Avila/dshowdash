// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.ticker.telemetry.logger
// PURPOSE: Ticker Logger - Telemetry logging with Ports pattern
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract GET_VERSION - getVersion() returns module version
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// @contract LOGGER - Logger() constructor for creating logger instances
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   Logger() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v5.7.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v5.6.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '5.7.0-P2-ENTERPRISE';
export const MODULE_ID = 'ticker.telemetry.logger';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function Logger(this: any, options: { debug?: boolean; prefix?: string } = {}) {
  this.debug = options.debug || false;this.prefix = options.prefix || '[Ticker]';this._metrics = { infoCount: 0, warnCount: 0, errorCount: 0, debugCount: 0, lastLogAt: null };_initPorts();
}
Logger.prototype._getLogger = () => _getPort('logger');
Logger.prototype.info = function() { if (!this.debug) return; const logger = this._getLogger(); if (logger && logger.info) logger.info.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments))); this._metrics.infoCount++; this._metrics.lastLogAt = Date.now(); };
Logger.prototype.log = function() { if (!this.debug) return; const logger = this._getLogger(); if (logger && logger.debug) logger.debug.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments))); this._metrics.debugCount++; this._metrics.lastLogAt = Date.now(); };
Logger.prototype.warn = function() { const logger = this._getLogger(); if (logger && logger.warn) logger.warn.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments))); this._metrics.warnCount++; this._metrics.lastLogAt = Date.now(); };
Logger.prototype.error = function() { const logger = this._getLogger(); if (logger && logger.error) logger.error.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments))); this._metrics.errorCount++; this._metrics.lastLogAt = Date.now(); };
Logger.prototype.healthCheck = function() { const logger = this._getLogger(); const checks: Record<string, boolean> = { ready: true, hasLogger: !!logger, loggerReady: !!(logger && logger.isReady ? logger.isReady() : logger), portsInitialized: Ports.isInitialized() }; let passed = 0; for (const k in checks) { if (checks[k]) passed++; } return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; };
Logger.prototype.getInfo = function() { return { version: VERSION, moduleId: MODULE_ID, debugEnabled: this.debug, prefix: this.prefix, metrics: Object.assign({}, this._metrics), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; };
Logger.prototype.setDebug = function(enabled: unknown) { this.debug = !!enabled; };
Logger.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
Logger.prototype.resetMetrics = function() { this._metrics = { infoCount: 0, warnCount: 0, errorCount: 0, debugCount: 0, lastLogAt: null }; };
export function getVersion() { return VERSION; }
export function healthCheck() { const logger = _getPort('logger'); const checks: Record<string, boolean> = { moduleLoaded: true, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; let passed = 0; for (const k in checks) { if (checks[k]) passed++; } return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }
export { Logger };
export default Logger;
