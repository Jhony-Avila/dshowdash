// ═════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.4.0-ES6)
// ═════════════════════════════════════════════════════════════
// MODULE: header.panel-adwords.telemetry.logger
// PURPOSE: Enterprise P17WI
// ─────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// ═════════════════════════════════════════════════════════════
// Logger - Enterprise P17WI
// @version 8.4.0-ES6
// @changelog v8.4.0-ES6 - Task 10.1 B02: var → const/let
// P17WI: PortsFactory/PortsProfiles pattern
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'header.panel-adwords.telemetry.logger';
export const VERSION = '8.4.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

let _metrics = { logs: 0, warns: 0, errors: 0 };

function Logger(this: any, options: Record<string,unknown>) { if (!options) options = {}; this.prefix = options.prefix || '[panel-adwords]'; this.debug = options.debug || false; }
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
