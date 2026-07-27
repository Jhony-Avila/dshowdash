// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-logger
// PURPOSE: Sidebar V2 - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   SidebarLogger() — exported function
//   createLogger() — exported function
//   getDefaultLogger() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';


export const VERSION = '5.8.0-ES6';
export const MODULE_ID = 'sidebar-logger';
const PREFIX = '[sidebar]';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function SidebarLogger(this: any, options: { debug?: boolean; prefix?: string } = {}) {
  this._debug = options.debug !== undefined ? options.debug : false;
  this._prefix = options.prefix || PREFIX;
  this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 };
  _initPorts();
}

SidebarLogger.prototype._getLogger = () => _getPort('logger');
SidebarLogger.prototype.setDebug = function(value: string) { this._debug = value; };

SidebarLogger.prototype.debug = function(...args: DynObj[]) {
  if (!this._debug) return;
  const logger = this._getLogger();
  if (logger && logger.debug) logger.debug(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.debug++; this._metrics.total++;
};

SidebarLogger.prototype.info = function(...args: DynObj[]) {
  const logger = this._getLogger();
  if (logger && logger.info) logger.info(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.info++; this._metrics.total++;
};

SidebarLogger.prototype.warn = function(...args: DynObj[]) {
  const logger = this._getLogger();
  if (logger && logger.warn) logger.warn(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.warn++; this._metrics.total++;
};

SidebarLogger.prototype.error = function(...args: DynObj[]) {
  const logger = this._getLogger();
  if (logger && logger.error) logger.error(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.error++; this._metrics.total++;
};

SidebarLogger.prototype.log = function(...args: DynObj[]) {
  const logger = this._getLogger();
  if (logger && logger.info) logger.info(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.total++;
};

SidebarLogger.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
SidebarLogger.prototype.reset = function() { this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 }; };

SidebarLogger.prototype.healthCheck = function() {
  const hasLogger = !!this._getLogger();
  const checks = { hasLogger, debugModeSet: typeof this._debug === 'boolean', prefixSet: !!this._prefix, metricsTracking: this._metrics.total >= 0, portsInitialized: Ports.isInitialized() };
  let passed = 0; for (const k in checks) { if ((checks as DynObj)[k]) passed++; }
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, debugEnabled: this._debug, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};

SidebarLogger.prototype.getInfo = function() { return { moduleId: MODULE_ID, version: VERSION, debugEnabled: this._debug, prefix: this._prefix, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics() }; };

function createLogger(options: DynObj) { return (new (SidebarLogger as DynObj)(options)); }

let _defaultInstance: DynObj = null;
function getDefaultLogger() { if (!_defaultInstance) _defaultInstance = (new (SidebarLogger as DynObj)()); return _defaultInstance; }
function getMetrics() { return getDefaultLogger().getMetrics(); }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
function healthCheck() { return getDefaultLogger().healthCheck(); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export { SidebarLogger, createLogger, getDefaultLogger, info, getMetrics, healthCheck };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export default { VERSION, MODULE_ID, SidebarLogger, createLogger, getDefaultLogger, info, getMetrics, healthCheck, injectPorts, getPorts };
