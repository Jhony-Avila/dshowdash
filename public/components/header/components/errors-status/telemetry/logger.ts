// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.errors-status.telemetry.logger
// PURPOSE: Logger - Enterprise P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   Logger() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
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

export const MODULE_ID = 'header.errors-status.telemetry.logger';
export const VERSION = '8.4.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

let _metrics = { logs: 0, warns: 0, errors: 0 };

function Logger(this: any, options: Record<string,unknown>) { if (!options) options = {}; this.prefix = options.prefix || '[errors-status]'; this.debug = options.debug || false; }
Logger.prototype.info = function(...args: unknown[]) { if (!this.debug) return; _metrics.logs++; const L = _getPort('logger'); if (L && L.info) L.info(...[this.prefix].concat(Array.prototype.slice.call(args))); else if (L && L.debug) L.debug(...[this.prefix].concat(Array.prototype.slice.call(args))); };
Logger.prototype.warn = function(...args: unknown[]) { _metrics.warns++; const L = _getPort('logger'); if (L && L.warn) L.warn(...[this.prefix].concat(Array.prototype.slice.call(args))); };
Logger.prototype.error = function(...args: unknown[]) { _metrics.errors++; const L = _getPort('logger'); if (L && L.error) L.error(...[this.prefix].concat(Array.prototype.slice.call(args))); };
Logger.prototype.debug = function(...args: unknown[]) { if (!this.debug) return; _metrics.logs++; const L = _getPort('logger'); if (L && L.debug) L.debug(...[this.prefix].concat(Array.prototype.slice.call(args))); };
Logger.prototype.getMetrics = () => Object.assign({}, _metrics);
Logger.prototype.resetMetrics = () => { _metrics = { logs: 0, warns: 0, errors: 0 }; };
Logger.prototype.healthCheck = function() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized() }; };

function getMetrics() { return Object.assign({}, _metrics); }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized() }; }

export { Logger, getMetrics, info, healthCheck, injectPorts, getPorts };
