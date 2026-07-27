// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-logger
// PURPOSE: Login Modal - Internal Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   Logger() — exported function
//   LOG_LEVELS — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'login-modal-logger';
export const VERSION = '5.7.1-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const LOG_LEVELS: Record<string, number> = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };

function Logger(this: any, config: Record<string, any> = {}) {
  this.logLevel = this._parseLogLevel(config.logLevel || 'info');
  this.silent = config.silent || false;
  this.traceId = this._generateTraceId();
  this.context = config.context || {};
  this._metrics = { logs: 0, errors: 0 };
  _initPorts();
}

Logger.prototype._getLogger = () => _getPort('logger');
Logger.prototype._generateTraceId = () => `login-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
Logger.prototype._parseLogLevel = (level: string) => { const upper = level.toUpperCase(); return LOG_LEVELS[upper] !== undefined ? LOG_LEVELS[upper] : LOG_LEVELS.INFO; };

Logger.prototype.log = function(level: string, message: string, data: unknown, options: Record<string, unknown>) {
  const levelValue = LOG_LEVELS[level.toUpperCase()];
  if (levelValue > this.logLevel) return null;
  if (this.silent && level !== 'error') return null;
  this._metrics.logs++;
  if (level === 'error') this._metrics.errors++;
  const logger = this._getLogger();
  if (!logger) return { level, message, data };
  const ctx = { ...this.context, traceId: this.traceId, data };
  const fn = logger[level] || logger.info;
  if (typeof fn === 'function') fn.call(logger, '[login-modal]', message, ctx);
  return { level, message, data };
};

Logger.prototype.error = function(message: string, data: unknown, options: Record<string, unknown>) { return this.log('error', message, data, options); };
Logger.prototype.warn = function(message: string, data: unknown, options: Record<string, unknown>) { return this.log('warn', message, data, options); };
Logger.prototype.info = function(message: string, data: unknown, options: Record<string, unknown>) { return this.log('info', message, data, options); };
Logger.prototype.debug = function(message: string, data: unknown, options: Record<string, unknown>) { return this.log('debug', message, data, options); };
Logger.prototype.getTraceId = function() { return this.traceId; };
Logger.prototype.renewTraceId = function() { this.traceId = this._generateTraceId(); return this.traceId; };
Logger.prototype.setContext = function(key: string, value: unknown) { this.context[key] = value; };
Logger.prototype.clearContext = function() { this.context = {}; };
Logger.prototype.setLogLevel = function(level: string) { this.logLevel = this._parseLogLevel(level); };
Logger.prototype.setSilent = function(silent: boolean) { this.silent = silent; };

Logger.prototype.info_module = function() { return { moduleId: MODULE_ID, version: VERSION, logLevel: this.logLevel, silent: this.silent, traceId: this.traceId, portsInitialized: Ports.isInitialized(), metrics: { ...this._metrics }, timestamp: Date.now() }; };
Logger.prototype.healthCheck = function() { const hasLogger = !!this._getLogger(); const checks = { hasLogger, hasTraceId: !!this.traceId, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
export const healthCheck = () => { const logger = _getPort('logger'); const checks = { moduleLoaded: true, loggerClass: typeof Logger === 'function', loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { Logger, LOG_LEVELS };
export default Logger;
